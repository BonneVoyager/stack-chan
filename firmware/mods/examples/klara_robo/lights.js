import Timer from 'timer'

// Drives every LED strip the host knows about (the head ring on M5StackChan).
// `setBase` is the steady glow; `flash` and `rainbow` show briefly and then
// return to it. Colors are [red, green, blue], kept low because the ring is bright.
export function createLights(robot) {
  const names = Object.keys(robot.lighting?.led ?? {})
  let base
  let timer

  const each = (apply) => {
    for (const name of names) {
      try {
        apply(name)
      } catch (error) {
        trace(`klara robo: light failed ${error}\n`)
      }
    }
  }
  const showBase = () => {
    timer = undefined
    if (base) each((name) => robot.lighting.lightOn(name, base[0], base[1], base[2]))
    else each((name) => robot.lighting.lightOff(name))
  }
  const showFor = (ms, apply) => {
    if (timer) Timer.clear(timer)
    each(apply)
    timer = Timer.set(showBase, ms)
  }

  return {
    setBase(color) {
      base = color
      if (!timer) showBase()
    },
    flash(color, ms) {
      showFor(ms, (name) => robot.lighting.lightOn(name, color[0], color[1], color[2]))
    },
    rainbow(ms) {
      showFor(ms, (name) => robot.lighting.lightRainbow(name))
    },
  }
}
