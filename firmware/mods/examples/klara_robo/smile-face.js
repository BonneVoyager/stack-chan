import { FaceBase } from 'behaviors/face'
import { Emotion } from 'face-state'
import { Eye } from 'parts/eye'
import { Content, Skin } from 'piu/MC'
import RoundRect from 'piu/RoundRect'

// Same placement as the host's SimpleFace: a 200x120 area centered on the screen.
const FACE = { left: 60, top: 60, width: 200, height: 120 }
const EYES = { left: { cx: 30, cy: 33 }, right: { cx: 170, cy: 36 } }
const EYE_RADIUS = 12

// Feminine touches: thin brows, lashes at the outer corners, blush, and rose lips.
const BROW = { width: 24, height: 3, gap: 23 }
// One lash flick per eye, drawn as small steps that rise from the outer upper
// edge of the eye. Each step is [distance from the eye center toward the outer
// corner, top above the center].
const LASH_STEPS = [
  [9, 11],
  [12, 13],
  [15, 15],
]
const LASH_STEP = { width: 3, height: 2 }
const BLUSH = { width: 22, height: 10, offsetX: 4, offsetY: 24, color: '#ff9aa8' }
const LIP_COLOR = '#e8456b'
// A wide mouth with a flat top and round bottom corners reads as a grin.
const MOUTH = { cx: 100, top: 68, speechHeight: 16 }

const SMILE_CORNERS = RoundRect.bottomLeft | RoundRect.bottomRight
const FROWN_CORNERS = RoundRect.topLeft | RoundRect.topRight

// Poses are small offsets around the resting smile so the face stays calm.
const POSES = {
  smile: { browLeft: 0, browRight: 0, mouthWidth: 72, mouthHeight: 24, emotion: Emotion.HAPPY },
  grin: { browLeft: 3, browRight: 3, mouthWidth: 80, mouthHeight: 30, emotion: Emotion.HAPPY },
  curious: { browLeft: 7, browRight: 7, mouthWidth: 60, mouthHeight: 20, emotion: Emotion.NEUTRAL },
  leftBrow: { browLeft: 6, browRight: 0, mouthWidth: 68, mouthHeight: 22, emotion: Emotion.HAPPY },
  rightBrow: { browLeft: 0, browRight: 6, mouthWidth: 68, mouthHeight: 22, emotion: Emotion.HAPPY },
  purse: { browLeft: 1, browRight: 1, mouthWidth: 62, mouthHeight: 20, emotion: Emotion.HAPPY },
  wide: { browLeft: 1, browRight: 1, mouthWidth: 76, mouthHeight: 24, emotion: Emotion.HAPPY },
  sleep: { browLeft: 0, browRight: 0, mouthWidth: 44, mouthHeight: 12, emotion: Emotion.SLEEPY },
  surprised: { browLeft: 7, browRight: 7, mouthWidth: 36, mouthHeight: 30, emotion: Emotion.NEUTRAL },
  yawn: { browLeft: 2, browRight: 2, mouthWidth: 44, mouthHeight: 40, emotion: Emotion.SLEEPY },
  // `frown` rounds the top of the mouth instead of the bottom.
  sad: { browLeft: 0, browRight: 0, mouthWidth: 52, mouthHeight: 16, emotion: Emotion.SAD, frown: true },
}

// Each act is a list of [pose, hold in ms]; the face rests on `smile` between acts.
const ACTS = [
  [['grin', 1800]],
  [['grin', 1400]],
  [['curious', 1700]],
  [['leftBrow', 1300]],
  [['rightBrow', 1300]],
  [
    ['purse', 350],
    ['wide', 350],
    ['purse', 350],
  ],
]
const REST_MS = { min: 3000, max: 7000 }
const REACTION_MS = 1700
const TICK_MS = 66
const EASE = 0.35

function randomBetween(min, max) {
  return min + Math.random() * (max - min)
}

// Moves a whole-pixel value part of the way to its target, at least one pixel per tick.
function ease(value, target) {
  const distance = target - value
  if (distance === 0) return value
  const step = Math.max(1, Math.round(Math.abs(distance) * EASE))
  return value + Math.sign(distance) * Math.min(step, Math.abs(distance))
}

class PrimarySkinBehavior extends Behavior {
  onFaceSkin(content, palette) {
    content.skin = palette.primary
  }
}

// The lips keep their own color, so this does not follow the face skin.
class SmileMouthBehavior extends Behavior {
  #width = POSES.smile.mouthWidth
  #height = POSES.smile.mouthHeight
  #speech = 0
  #frown = false
  #drawnWidth = 0
  #drawnHeight = 0

  onFaceState(mouth, face) {
    this.#speech = Math.round(face.mouth.open * MOUTH.speechHeight)
    this.#update(mouth)
  }

  setShape(mouth, width, height, frown) {
    this.#width = width
    this.#height = height
    if (frown !== this.#frown) {
      this.#frown = frown
      mouth.corners = frown ? FROWN_CORNERS : SMILE_CORNERS
      // Force the next update to rebuild the outline with the new corners.
      this.#drawnWidth = 0
    }
    this.#update(mouth)
  }

  #update(mouth) {
    const width = this.#width
    const height = this.#height + this.#speech
    if (width === this.#drawnWidth && height === this.#drawnHeight) return
    this.#drawnWidth = width
    this.#drawnHeight = height
    mouth.radius = Math.min(height, width / 2)
    mouth.coordinates = { left: MOUTH.cx - width / 2, top: MOUTH.top, width, height }
  }
}

class BrowBehavior extends PrimarySkinBehavior {
  #lift = 0

  setLift(brow, lift, eye) {
    if (lift === this.#lift) return
    this.#lift = lift
    brow.coordinates = browCoordinates(eye, lift)
  }
}

function browCoordinates(eye, lift) {
  return {
    left: eye.cx - BROW.width / 2,
    top: eye.cy - BROW.gap - lift,
    width: BROW.width,
    height: BROW.height,
  }
}

function createBrow(eye) {
  return new RoundRect(null, { ...browCoordinates(eye, 0), radius: 1, Behavior: BrowBehavior })
}

// `outward` is -1 for the eye on the left of the screen and 1 for the one on the right.
function createLashes(eye, outward) {
  return LASH_STEPS.map(
    ([distance, above]) =>
      new Content(null, {
        left: outward > 0 ? eye.cx + distance : eye.cx - distance - LASH_STEP.width,
        top: eye.cy - above,
        ...LASH_STEP,
        Behavior: PrimarySkinBehavior,
      }),
  )
}

function createBlush(eye, outward, skin) {
  return new RoundRect(null, {
    left: eye.cx + outward * BLUSH.offsetX - BLUSH.width / 2,
    top: eye.cy + BLUSH.offsetY,
    width: BLUSH.width,
    height: BLUSH.height,
    radius: BLUSH.height / 2,
    skin,
  })
}

function createMouth() {
  const { mouthWidth: width, mouthHeight: height } = POSES.smile
  return new RoundRect(null, {
    left: MOUTH.cx - width / 2,
    top: MOUTH.top,
    width,
    height,
    radius: height,
    corners: SMILE_CORNERS,
    skin: new Skin({ fill: LIP_COLOR }),
    Behavior: SmileMouthBehavior,
  })
}

// Invisible content whose clock plays the acts and eases the parts toward each pose.
// Returns the content and the controls that steer it from outside the face.
function createDirector({ browLeft, browRight, mouth, setEmotion }) {
  const queue = []
  const current = { ...POSES.smile }
  let target = POSES.smile
  let nextChangeAt = 0
  let asleep = false
  let restScale = 1

  const aim = (pose, until) => {
    target = POSES[pose]
    nextChangeAt = until
    if (target.emotion !== current.emotion) {
      current.emotion = target.emotion
      setEmotion(target.emotion)
    }
  }

  const advance = (now) => {
    if (queue.length === 0) {
      queue.push(['smile', randomBetween(REST_MS.min, REST_MS.max) * restScale])
      queue.push(...ACTS[Math.floor(Math.random() * ACTS.length)])
    }
    const [pose, holdMs] = queue.shift()
    aim(pose, now + holdMs)
  }

  const controls = {
    // Asleep holds a small mouth and sleepy eyes; waking up starts with a grin.
    setAsleep(value) {
      if (value === asleep) return
      asleep = value
      queue.length = 0
      if (asleep) aim('sleep', Number.POSITIVE_INFINITY)
      else aim('grin', Date.now() + REACTION_MS)
    },
    // Plays one pose right away, then returns to the usual idle acts.
    react(pose, holdMs = REACTION_MS) {
      if (asleep) return
      queue.length = 0
      aim(pose, Date.now() + holdMs)
    },
    // Stretches (above 1) or shortens (below 1) the rests between idle acts.
    setRestScale(scale) {
      restScale = scale
    },
  }

  const content = new Content(null, {
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    Behavior: class extends Behavior {
      onDisplaying(content) {
        setEmotion(current.emotion)
        content.interval = TICK_MS
        content.start()
      }

      onUndisplaying(content) {
        content.stop()
      }

      onTimeChanged() {
        const now = Date.now()
        if (now >= nextChangeAt) advance(now)
        current.browLeft = ease(current.browLeft, target.browLeft)
        current.browRight = ease(current.browRight, target.browRight)
        current.mouthWidth = ease(current.mouthWidth, target.mouthWidth)
        current.mouthHeight = ease(current.mouthHeight, target.mouthHeight)
        // The parts skip the layout change when their value is unchanged.
        browLeft.behavior.setLift(browLeft, current.browLeft, EYES.left)
        browRight.behavior.setLift(browRight, current.browRight, EYES.right)
        mouth.behavior.setShape(mouth, current.mouthWidth, current.mouthHeight, target.frown === true)
      }
    },
  })
  return { content, controls }
}

// Active layer over the face area. It reports the touch and passes it on, so the
// host still reveals its app bar as it does for the built-in faces.
function createTouchLayer(onTouch) {
  return new Content(null, {
    left: 0,
    top: 0,
    width: FACE.width,
    height: FACE.height,
    active: true,
    Behavior: class extends Behavior {
      onTouchEnded(content) {
        onTouch()
        content.bubble('onFaceTouch')
      }
    },
  })
}

// `setEmotion` switches the host's eye style, e.g. (emotion) => robot.face.setEmotion(emotion).
// `onTouch` is called when the face area of the screen is tapped.
// Returns the face `content` for robot.ui.setFace plus the controls
// `setAsleep(boolean)`, `react(pose, holdMs)` and `setRestScale(scale)`.
export function createSmileFace({ setEmotion, onTouch }) {
  const browLeft = createBrow(EYES.left)
  const browRight = createBrow(EYES.right)
  const mouth = createMouth()
  const blushSkin = new Skin({ fill: BLUSH.color })
  const director = createDirector({ browLeft, browRight, mouth, setEmotion })
  const content = new FaceBase({
    ...FACE,
    contents: [
      browLeft,
      browRight,
      new Eye({ ...EYES.left, radius: EYE_RADIUS, side: 'left' }),
      new Eye({ ...EYES.right, radius: EYE_RADIUS, side: 'right' }),
      // Lashes go after the eyes so the eyelids do not cover them.
      ...createLashes(EYES.left, -1),
      ...createLashes(EYES.right, 1),
      createBlush(EYES.left, -1, blushSkin),
      createBlush(EYES.right, 1, blushSkin),
      mouth,
      director.content,
      createTouchLayer(onTouch),
    ],
  })
  return { content, ...director.controls }
}
