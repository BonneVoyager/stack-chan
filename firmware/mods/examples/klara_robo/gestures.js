// A gesture is what her whole body does at once, so speech, face, head, hands
// and lights read as one reaction.
//   pose    face pose from smile-face.js
//   head    move from head.js
//   hands   host hand animation shown beside the face
//   effect  host emoticon floating over the face
//   light   [red, green, blue] flash, or 'rainbow'
//   sound   tune from SOUNDS, played before any speech
export const GESTURES = {
  greet: { pose: 'grin', head: 'smallNod', light: [0, 20, 8], sound: 'chirp' },
  cheer: { pose: 'grin', head: 'nod', hands: 'clap', light: [24, 16, 0], sound: 'happy' },
  ask: { pose: 'curious', head: 'tilt', hands: 'thinking', light: [0, 8, 24], sound: 'chirp' },
  love: { pose: 'grin', head: 'smallNod', effect: 'heart', light: [24, 4, 10], sound: 'happy' },
  play: { pose: 'wide', head: 'wiggle', hands: 'rock-paper-scissors', light: 'rainbow', sound: 'happy' },
  calm: { pose: 'smile', light: [4, 10, 14] },
  hum: { pose: 'wide', head: 'wiggle', light: 'rainbow' },
  surprise: { pose: 'surprised', head: 'perk', effect: 'sweat', light: [24, 24, 24], sound: 'dizzy' },
  dizzy: { pose: 'surprised', head: 'shake', effect: 'sweat', light: [20, 0, 20], sound: 'dizzy' },
  sad: { pose: 'sad', effect: 'tear', light: [0, 0, 16], sound: 'sad' },
  yawn: { pose: 'yawn', sound: 'yawn' },
}

// Tunes are lists of [frequency in Hz, duration in ms].
export const SOUNDS = {
  chirp: [
    [988, 60],
    [1319, 80],
  ],
  happy: [
    [784, 70],
    [988, 70],
    [1319, 110],
  ],
  sad: [
    [659, 120],
    [494, 180],
  ],
  dizzy: [
    [880, 60],
    [660, 60],
    [880, 60],
    [660, 60],
  ],
  yawn: [
    [523, 200],
    [392, 300],
  ],
}
