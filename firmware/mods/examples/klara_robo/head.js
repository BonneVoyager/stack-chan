import Timer from 'timer'

// Head moves are lists of [yaw, pitch, seconds]. Angles are in radians: positive
// yaw turns to her left and negative pitch looks up. The M5StackChan servo cannot
// go below its resting pitch, so every move stays level or tilts upward.
export const HEAD_MOVES = {
  nod: [
    [0, -0.3, 0.35],
    [0, 0, 0.35],
    [0, -0.3, 0.35],
    [0, 0, 0.35],
  ],
  smallNod: [
    [0, -0.2, 0.3],
    [0, 0, 0.3],
  ],
  tilt: [
    [0.22, -0.18, 0.5],
    [0.22, -0.18, 0.7],
    [0, 0, 0.5],
  ],
  wiggle: [
    [0.2, -0.05, 0.3],
    [-0.2, -0.05, 0.3],
    [0.2, -0.05, 0.3],
    [0, 0, 0.3],
  ],
  shake: [
    [0.15, 0, 0.15],
    [-0.15, 0, 0.15],
    [0.15, 0, 0.15],
    [-0.15, 0, 0.15],
    [0, 0, 0.2],
  ],
  perk: [
    [0, -0.25, 0.3],
    [0, -0.25, 0.6],
    [0, 0, 0.4],
  ],
}

function delay(ms) {
  return new Promise((resolve) => Timer.set(resolve, ms))
}

// Owns the servos so only one move plays at a time. A new move takes over from
// the one in progress. The servos are powered only while moving, as the host
// does for its own gaze.
export function createHead(robot) {
  let latest = 0
  let active = 0
  let movedAt = 0

  return {
    get isBusy() {
      return active > 0
    },
    // Time of the last servo command; the motion sensor in the head ignores shakes near it.
    get movedAt() {
      return movedAt
    },
    async play(steps) {
      const move = ++latest
      active++
      try {
        await robot.motion.setTorque(true)
        for (const [y, p, seconds] of steps) {
          if (move !== latest) return
          movedAt = Date.now()
          // setPose resolves once the command is sent, so wait out the move itself.
          await robot.motion.setPose({ rotation: { y, p, r: 0 } }, seconds)
          await delay(seconds * 1000)
          movedAt = Date.now()
        }
        if (move === latest) await robot.motion.setTorque(false)
      } catch (error) {
        trace(`klara robo: head move failed ${error}\n`)
      } finally {
        active--
      }
    },
  }
}
