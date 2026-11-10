import { startMillisecondDisplay } from 'digi-clock'
import { Emoticon } from 'effects/emoticon'
import { GESTURES, SOUNDS } from 'gestures'
import { createHead, HEAD_MOVES } from 'head'
import { createLights } from 'lights'
import { createRainbow } from 'rainbow'
import {
  ARRIVAL_SAYINGS,
  FALLEN_SAYINGS,
  FAREWELL_SAYINGS,
  HUMS,
  PAT_SAYINGS,
  SAYINGS,
  SHAKEN_SAYINGS,
  TOUCH_SAYINGS,
  UPSIDE_DOWN_SAYINGS,
  YAWN_SAYINGS,
} from 'sayings'
import { createSmileFace } from 'smile-face'
import { randomBetween } from 'stackchan-util'
import Timer from 'timer'
import { startPresenceSensor } from 'tmos-pir'

// Unit Dual Button on CoreS3 Port B. Change the pins to match the port in use.
const PINS = { a: 9, b: 8 }
const DEBOUNCE_MS = 50

// Idle head movement: a small glance near the center after each pause.
// Yaw and pitch are in radians; pitch only goes up from rest.
const GLANCE_PAUSE_MS = { min: 4000, max: 7000 }
const GLANCE_YAW = 0.3
const GLANCE_PITCH = -0.2
const GLANCE_SECONDS = { min: 0.8, max: 1.3 }

// The bundled stackchan-voice engine is Japanese, so "hello rainbow!" is spelled in kana.
const GREETING = 'ハロー、レインボー！'
const RAINBOW_MS = 3000

// Idle chatter: one random saying after each pause.
const CHATTER_PAUSE_MS = { min: 15_000, max: 30_000 }
const BALLOON_MS = 2500
// Below the mouth, clear of the host's app bar at the top.
const BALLOON = { right: 20, bottom: 8, width: 220 }
const STATUS_MS = 6000
// How long a gesture's face pose, hands, effect and light stay.
const GESTURE_MS = 2500

// Presence (Unit TMOS PIR): she falls asleep after being alone this long,
// and reacts to nearby movement at most this often.
const SLEEP_AFTER_MS = 120_000
const MOTION_REACTION_MS = 15_000

// Head pats (touch strip on top of the body): how often she reacts and speaks.
const PAT_REACTION_MS = 1500
const PAT_SAYING_MS = 8000

// Being handled (motion sensor in the head): how often she reacts, and how long
// after her own head moves a shake is ignored.
const HANDLING_REACTION_MS = 4000
const SHAKE_GUARD_MS = 800

// Energy runs from 0 (asleep) to 1 (lively). It drains while she is ignored,
// each interaction tops it up, and it sets the pace of everything she does idly.
const ENERGY = {
  start: 0.6,
  tickMs: 30_000,
  drain: 0.03,
  // Floor while the presence sensor sees someone, so she does not doze off on them.
  presentFloor: 0.3,
  // Ceiling during the night hours of the device clock.
  nightCeiling: 0.35,
  nightFrom: 23,
  nightTo: 7,
  wakeTo: 0.5,
  yawnBelow: 0.3,
  yawnChance: 0.5,
  humAbove: 0.55,
  humChance: 0.15,
}
const BOOST = { touch: 0.2, pat: 0.25, button: 0.15, arrival: 0.4, handled: 0.2, motion: 0.05 }

// Watches a Dual Button pin. `hostButton` is the host's own button of the same
// name, which is how the buttons are pressed in the browser simulator.
function watchButton(pin, hostButton, onPress) {
  if (hostButton) {
    hostButton.onEvent = (event) => {
      if (event.pressed) onPress()
    }
  }
  // The simulator has no GPIO.
  const Digital = globalThis.device?.io?.Digital
  if (!Digital || pin === undefined) return undefined
  let lastPress = 0
  return new Digital({
    pin,
    mode: Digital.InputPullUp,
    edge: Digital.Falling,
    onReadable() {
      // The buttons pull the line low while pressed.
      if (this.read() !== 0) return
      const now = Date.now()
      if (now - lastPress < DEBOUNCE_MS) return
      lastPress = now
      onPress()
    },
  })
}

function delay(ms) {
  return new Promise((resolve) => Timer.set(resolve, ms))
}

// Returns a function that picks a random item, never the same one twice in a row.
function createPicker(items) {
  let last = -1
  return () => {
    if (items.length === 1) return items[0]
    let index = Math.floor(Math.random() * (items.length - 1))
    if (index >= last && last >= 0) index++
    last = index
    return items[index]
  }
}

// Runs `run` again and again, waiting `pauseMs()` before each turn.
function every(pauseMs, run) {
  const scheduleNext = () => {
    Timer.set(async () => {
      try {
        await run()
      } catch (error) {
        trace(`klara robo: ${error}\n`)
      }
      scheduleNext()
    }, pauseMs())
  }
  scheduleNext()
}

export function onContextCreated(robot) {
  const head = createHead(robot)
  const lights = createLights(robot)

  // Unit status goes to a balloon, because trace output is not visible on a release host.
  const unitStatus = {}
  let statusTimer
  const showStatus = (text) => {
    robot.ui.showBalloon(text, BALLOON)
    if (statusTimer) Timer.clear(statusTimer)
    statusTimer = Timer.set(() => robot.ui.hideBalloon(), STATUS_MS)
  }
  const reportUnit = (unit) => (message) => {
    trace(`klara robo: ${unit} ${message}\n`)
    unitStatus[unit] = message
    showStatus(
      Object.keys(unitStatus)
        .map((name) => `${name}: ${unitStatus[name]}`)
        .join(', '),
    )
  }
  startMillisecondDisplay(reportUnit('Clock'))

  // One sound at a time; a request made while the speaker is busy is dropped.
  let isAudioBusy = false
  const withAudio = async (play) => {
    if (isAudioBusy) return
    isAudioBusy = true
    try {
      await play()
    } catch (error) {
      trace(`klara robo: audio failed ${error}\n`)
    } finally {
      isAudioBusy = false
    }
  }
  const playTune = async (name) => {
    for (const [hz, ms] of SOUNDS[name]) await robot.audio.tone(hz, ms)
  }

  let isShowingRainbow = false
  const isBusy = () => isAudioBusy || isShowingRainbow

  // Flourishes beside and over the face, each shown for a moment.
  const effects = {}
  let shownEffect
  let effectTimer
  const hideEffect = () => {
    if (effectTimer) Timer.clear(effectTimer)
    effectTimer = undefined
    if (shownEffect) robot.ui.removeEffect(shownEffect)
    shownEffect = undefined
  }
  const showEffect = (key, ms) => {
    hideEffect()
    effects[key] ??= new Emoticon({ key })
    shownEffect = effects[key]
    robot.ui.addEffect(shownEffect)
    effectTimer = Timer.set(hideEffect, ms)
  }
  let handsTimer
  const showHands = (animation, ms) => {
    if (handsTimer) Timer.clear(handsTimer)
    robot.ui.setHandAnimation(animation)
    handsTimer = Timer.set(() => {
      handsTimer = undefined
      robot.ui.setHandAnimation('none')
    }, ms)
  }

  // Plays a gesture with her whole body and, with it, an optional saying or hum.
  const perform = async (name, saying) => {
    const gesture = GESTURES[name] ?? {}
    if (gesture.pose) face.react(gesture.pose, GESTURE_MS)
    if (gesture.head) void head.play(HEAD_MOVES[gesture.head])
    if (gesture.hands) showHands(gesture.hands, GESTURE_MS)
    if (gesture.effect) showEffect(gesture.effect, GESTURE_MS)
    if (gesture.light === 'rainbow') lights.rainbow(GESTURE_MS)
    else if (gesture.light) lights.flash(gesture.light, GESTURE_MS)
    if (saying) robot.ui.showBalloon(saying.text, BALLOON)
    await Promise.all([
      withAudio(async () => {
        if (gesture.sound) await playTune(gesture.sound)
        if (saying?.speech) await robot.audio.say(saying.speech)
        else if (saying?.koe) await robot.audio.sing(saying.koe)
      }),
      delay(saying ? BALLOON_MS : 0),
    ])
    if (saying) robot.ui.hideBalloon()
  }
  const say = (saying) => perform(saying.gesture, saying)

  // Asleep: sleepy face with "zzz", lights off, no idle chatter or glances.
  let isAsleep = false
  let sleepTimer
  // Whether the presence sensor sees someone; undefined without the sensor.
  let isSomeoneThere
  let energy = ENERGY.start
  // Idle pauses stretch as her energy drops.
  const pace = () => 1.7 - energy
  const applyMood = () => {
    face.setRestScale(pace())
    lights.setBase(isAsleep ? undefined : [Math.round(4 + 12 * energy), Math.round(2 + 6 * energy), 0])
  }
  const sleepyEffect = new Emoticon({ key: 'sleepy', left: 10, top: 20, width: 50, height: 60 })
  const setAsleep = (asleep) => {
    if (asleep === isAsleep) return
    isAsleep = asleep
    face.setAsleep(asleep)
    if (asleep) {
      hideEffect()
      robot.ui.addEffect(sleepyEffect)
    } else {
      robot.ui.removeEffect(sleepyEffect)
    }
    applyMood()
  }
  const sleepLater = () => {
    if (sleepTimer) Timer.clear(sleepTimer)
    sleepTimer = Timer.set(() => {
      sleepTimer = undefined
      setAsleep(true)
    }, SLEEP_AFTER_MS)
  }
  // Every interaction wakes her and tops up her energy.
  const wake = (boost) => {
    if (sleepTimer) Timer.clear(sleepTimer)
    sleepTimer = undefined
    energy = Math.min(1, Math.max(energy, isAsleep ? ENERGY.wakeTo : 0) + boost)
    setAsleep(false)
    applyMood()
    if (isSomeoneThere === false) sleepLater()
  }

  // Smiling face that plays small idle expressions on its own and answers a touch.
  const pickTouchSaying = createPicker(TOUCH_SAYINGS)
  const face = createSmileFace({
    setEmotion: (emotion) => robot.face.setEmotion(emotion),
    onTouch: () => {
      wake(BOOST.touch)
      if (!isBusy()) void say(pickTouchSaying())
    },
  })
  robot.ui.setFace(face.content)
  applyMood()

  Timer.repeat(() => {
    const hour = new Date().getHours()
    energy = Math.max(0, Math.round((energy - ENERGY.drain) * 100) / 100)
    if (hour >= ENERGY.nightFrom || hour < ENERGY.nightTo) energy = Math.min(energy, ENERGY.nightCeiling)
    if (isSomeoneThere) energy = Math.max(energy, ENERGY.presentFloor)
    if (energy === 0) setAsleep(true)
    applyMood()
  }, ENERGY.tickMs)

  // Idle chatter: usually a saying, a yawn when tired, sometimes a hum when lively.
  const pickSaying = createPicker(SAYINGS)
  const pickYawn = createPicker(YAWN_SAYINGS)
  const pickHum = createPicker(HUMS)
  every(
    () => randomBetween(CHATTER_PAUSE_MS.min, CHATTER_PAUSE_MS.max) * pace(),
    () => {
      if (isBusy() || isAsleep) return undefined
      if (energy < ENERGY.yawnBelow && Math.random() < ENERGY.yawnChance) return say(pickYawn())
      if (energy > ENERGY.humAbove && Math.random() < ENERGY.humChance) return perform('hum', pickHum())
      return say(pickSaying())
    },
  )

  // Idle glances. Two random numbers are averaged so most stay near the center.
  every(
    () => randomBetween(GLANCE_PAUSE_MS.min, GLANCE_PAUSE_MS.max) * pace(),
    () => {
      if (head.isBusy || isAsleep) return undefined
      const yaw = (Math.random() + Math.random() - 1) * GLANCE_YAW
      const pitch = ((Math.random() + Math.random()) / 2) * GLANCE_PITCH
      return head.play([[yaw, pitch, randomBetween(GLANCE_SECONDS.min, GLANCE_SECONDS.max)]])
    },
  )

  // Presence sensor. Without it nothing here fires.
  const pickArrivalSaying = createPicker(ARRIVAL_SAYINGS)
  const pickFarewellSaying = createPicker(FAREWELL_SAYINGS)
  let hasGreeted = false
  let lastMotionReaction = 0
  startPresenceSensor({
    onPresence(present) {
      isSomeoneThere = present
      if (present) {
        wake(BOOST.arrival)
        hasGreeted = true
        if (!isBusy()) void say(pickArrivalSaying())
      } else {
        // No goodbye for a room that was already empty at startup.
        if (hasGreeted && !isAsleep && !isBusy()) void say(pickFarewellSaying())
        sleepLater()
      }
    },
    onMotion() {
      const now = Date.now()
      if (isAsleep || now - lastMotionReaction < MOTION_REACTION_MS) return
      lastMotionReaction = now
      energy = Math.min(1, energy + BOOST.motion)
      face.react('curious')
      if (!head.isBusy) void head.play(HEAD_MOVES.perk)
    },
    report: reportUnit('PIR'),
  })

  // Head pats on the touch strip: hearts and a happy sound, sometimes a few words.
  const pickPatSaying = createPicker(PAT_SAYINGS)
  let lastPat = 0
  let lastPatSaying = 0
  const pat = () => {
    const now = Date.now()
    if (now - lastPat < PAT_REACTION_MS) return
    lastPat = now
    wake(BOOST.pat)
    const speaks = now - lastPatSaying >= PAT_SAYING_MS && !isBusy()
    if (speaks) lastPatSaying = now
    void perform('love', speaks ? pickPatSaying() : undefined)
  }
  const touchPanel = robot.input.touchPanel
  if (touchPanel) {
    const onPanel = (event) => {
      if (event.gesture !== 'release') pat()
    }
    if (typeof touchPanel.subscribe === 'function') touchPanel.subscribe(onPanel)
    else touchPanel.onEvent = onPanel
  }

  // Being shaken, knocked over or turned upside down.
  const pickHandlingSaying = {
    shake: createPicker(SHAKEN_SAYINGS),
    upsideDown: createPicker(UPSIDE_DOWN_SAYINGS),
    fallen: createPicker(FALLEN_SAYINGS),
  }
  let lastHandled = 0
  const handled = (motion) => {
    const now = Date.now()
    if (now - lastHandled < HANDLING_REACTION_MS) return
    lastHandled = now
    wake(BOOST.handled)
    const saying = (pickHandlingSaying[motion] ?? pickHandlingSaying.fallen)()
    void perform(saying.gesture, isBusy() ? undefined : saying)
  }
  const imu = robot.input.imu
  if (imu) {
    imu.onEvent = (event) => {
      // Her own head moves shake the sensor too.
      const isOwnMove = head.isBusy || Date.now() - head.movedAt < SHAKE_GUARD_MS
      if (event.motion === 'shake' && isOwnMove) return
      handled(event.motion)
    }
    imu.start()
  }

  const showRainbow = async () => {
    if (isShowingRainbow) return
    isShowingRainbow = true
    wake(BOOST.button)
    robot.ui.setMain(createRainbow())
    lights.rainbow(RAINBOW_MS)
    try {
      await Promise.all([withAudio(() => robot.audio.say(GREETING)), delay(RAINBOW_MS)])
    } finally {
      robot.ui.showFace()
      isShowingRainbow = false
    }
  }

  watchButton(PINS.a, robot.input.button?.a, () => {
    trace('klara robo: A pressed, nodding\n')
    wake(BOOST.button)
    face.react('grin')
    void head.play(HEAD_MOVES.nod)
  })

  watchButton(PINS.b, robot.input.button?.b, () => {
    trace('klara robo: B pressed, rainbow\n')
    void showRainbow()
  })

  // Demos play each reaction in turn, so they can be tried without waiting for
  // the real trigger: button C in the simulator, "Next demo" in the host drawer.
  const find = (sayings, text) => sayings.find((saying) => saying.text === text)
  const demos = [
    ['Greeting', () => say(find(SAYINGS, 'Hello!'))],
    ['Praise', () => say(find(SAYINGS, 'Great job!'))],
    ['Question', () => say(find(SAYINGS, 'How are you?'))],
    ['Affection', () => say(find(SAYINGS, 'I like your smile!'))],
    ['Play', () => say(find(SAYINGS, "Let's play!"))],
    ['Head pat', () => perform('love', PAT_SAYINGS[0])],
    ['Shaken', () => say(SHAKEN_SAYINGS[1])],
    ['Fallen over', () => say(FALLEN_SAYINGS[1])],
    ['Upside down', () => say(UPSIDE_DOWN_SAYINGS[0])],
    ['Yawn', () => say(YAWN_SAYINGS[0])],
    ['Humming', () => perform('hum', HUMS[0])],
    ['Rainbow', showRainbow],
    ['Fall asleep', () => setAsleep(true)],
  ]
  let nextDemo = 0
  let isDemoRunning = false
  const playNextDemo = async () => {
    if (isDemoRunning || isBusy()) return
    isDemoRunning = true
    const [label, run] = demos[nextDemo]
    const title = `${nextDemo + 1}/${demos.length} ${label}`
    nextDemo = (nextDemo + 1) % demos.length
    trace(`klara robo: demo ${title}\n`)
    try {
      wake(0)
      showStatus(title)
      await delay(1200)
      await run()
    } catch (error) {
      trace(`klara robo: demo failed ${error}\n`)
    } finally {
      isDemoRunning = false
    }
  }
  watchButton(undefined, robot.input.button?.c, () => void playNextDemo())
  robot.ui.drawer?.addDrawerButton({
    key: 'klara-robo:demo',
    label: 'Next demo',
    callback(context) {
      context.ui.closeDrawer()
      void playNextDemo()
    },
  })
}
