import { closeUnit, hasI2C, openUnit } from 'i2c-units'
import Timer from 'timer'

// M5Stack Unit Digi-Clock (U146). Register map from M5Stack's M5Unit-DigiClock library.
const ADDRESS = 0x30
const REG_STRING = 0x20
const REG_BRIGHTNESS = 0x30

const BRIGHTNESS = 4
const REFRESH_MS = 50
const RETRY_MS = 5000

function writeRegister(i2c, register, bytes) {
  i2c.write(Uint8Array.of(register, ...bytes))
}

function writeDigits(i2c, digits) {
  const bytes = []
  for (let index = 0; index < digits.length; index++) bytes.push(digits.charCodeAt(index))
  writeRegister(i2c, REG_STRING, bytes)
}

// Shows the milliseconds of the running clock on the four digits. The first
// digit is whole seconds, the other three are the milliseconds within it.
// `report` receives a short status text whenever the connection state changes,
// because trace output is not visible on a release host.
export function startMillisecondDisplay(report) {
  if (!hasI2C()) return
  let i2c
  let connected
  let retryAt = 0

  Timer.repeat(() => {
    const now = Date.now()
    if (!i2c && now < retryAt) return
    try {
      i2c ??= openUnit(ADDRESS, (unit) => writeRegister(unit, REG_BRIGHTNESS, [BRIGHTNESS]))
      writeDigits(i2c, String(now % 10_000).padStart(4, '0'))
      if (connected !== true) {
        connected = true
        report('OK')
      }
    } catch (error) {
      if (i2c) closeUnit(i2c)
      i2c = undefined
      retryAt = now + RETRY_MS
      if (connected !== false) {
        connected = false
        report(String(error))
      }
    }
  }, REFRESH_MS)
}
