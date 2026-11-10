import { Container, Skin } from 'piu/MC'
import RoundRect from 'piu/RoundRect'

// Outermost color first, as in a real rainbow.
const RAINBOW_COLORS = [
  [0xff, 0x3b, 0x30],
  [0xff, 0x95, 0x00],
  [0xff, 0xe6, 0x00],
  [0x34, 0xc7, 0x59],
  [0x32, 0xad, 0xe6],
  [0x3a, 0x5b, 0xd9],
  [0x8e, 0x44, 0xad],
]
const SKY_COLOR = '#8fd3ff'
const CLOUD_COLOR = '#ffffff'
// Every step is one draw command and Piu's command list holds about 50 per frame,
// so the gradient is approximated with a limited number of thin bands.
const GRADIENT_STEPS = 21
const ARC_THICKNESS = 77
// Geometry for the 320x240 screen: the arc is centered near the bottom edge.
const ARC_CENTER = { x: 160, y: 224 }
const ARC_OUTER_RADIUS = 148

// Each shape is a single RoundRect. Drawing the arc row by row from a Port
// overflows Piu's command list and restarts the robot.
function gradientColor(step) {
  const position = (step / (GRADIENT_STEPS - 1)) * (RAINBOW_COLORS.length - 1)
  const index = Math.min(Math.floor(position), RAINBOW_COLORS.length - 2)
  const from = RAINBOW_COLORS[index]
  const to = RAINBOW_COLORS[index + 1]
  const channels = from.map((value, channel) => Math.round(value + (to[channel] - value) * (position - index)))
  return `#${channels.map((value) => value.toString(16).padStart(2, '0')).join('')}`
}

function halfDisc(fill, radius) {
  return new RoundRect(null, {
    left: ARC_CENTER.x - radius,
    top: ARC_CENTER.y - radius,
    width: radius * 2,
    height: radius,
    radius,
    corners: RoundRect.topLeft | RoundRect.topRight,
    skin: new Skin({ fill }),
  })
}

function cloud(cx) {
  const skin = new Skin({ fill: CLOUD_COLOR })
  const top = ARC_CENTER.y - 30
  return [
    new RoundRect(null, { left: cx - 22, top, width: 44, height: 44, radius: 22, skin }),
    new RoundRect(null, { left: cx - 44, top: top + 14, width: 88, height: 32, radius: 16, skin }),
  ]
}

// Full-screen rainbow arc with a cloud at each foot, for robot.ui.setMain.
export function createRainbow() {
  const innerRadius = ARC_OUTER_RADIUS - ARC_THICKNESS
  const bands = []
  for (let step = 0; step < GRADIENT_STEPS; step++) {
    const radius = ARC_OUTER_RADIUS - Math.round((step * ARC_THICKNESS) / GRADIENT_STEPS)
    bands.push(halfDisc(gradientColor(step), radius))
  }
  const footOffset = Math.round((ARC_OUTER_RADIUS + innerRadius) / 2)
  return new Container(null, {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    skin: new Skin({ fill: SKY_COLOR }),
    contents: [
      // Shrinking half discs, so each band is the ring left visible by the next one.
      ...bands,
      halfDisc(SKY_COLOR, innerRadius),
      ...cloud(ARC_CENTER.x - footOffset),
      ...cloud(ARC_CENTER.x + footOffset),
    ],
  })
}
