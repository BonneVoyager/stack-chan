import { closeUnit, hasI2C, openUnit } from 'i2c-units'
import Timer from 'timer'

// M5Stack Unit TMOS PIR (U185), an ST STHS34PF80 infrared presence sensor.
// Registers from ST's sths34pf80-pid driver.
const ADDRESS = 0x5a
const REG_WHO_AM_I = 0x0f
const REG_AVG_TRIM = 0x10
const REG_CTRL1 = 0x20
const REG_FUNC_STATUS = 0x25

const DEVICE_ID = 0xd3
const AVG_TMOS_32 = 0x02
const CTRL1_POWER_DOWN = 0x00
// Block data update, 4 Hz output data rate.
const CTRL1_BDU_4HZ = 0x15
const FLAG_MOTION = 0x02
const FLAG_PRESENCE = 0x04

const POLL_MS = 500
const RETRY_MS = 5000
// Presence must stay off this long before the person counts as gone.
const ABSENT_CONFIRM_MS = 5000

function readRegister(i2c, register) {
  return new Uint8Array(i2c.writeRead(Uint8Array.of(register), 1))[0]
}

function writeRegister(i2c, register, value) {
  i2c.write(Uint8Array.of(register, value))
}

function setupSensor(i2c) {
  if (readRegister(i2c, REG_WHO_AM_I) !== DEVICE_ID) throw new Error('unexpected device')
  // Averaging may only change while the sensor is powered down.
  writeRegister(i2c, REG_CTRL1, CTRL1_POWER_DOWN)
  writeRegister(i2c, REG_AVG_TRIM, AVG_TMOS_32)
  writeRegister(i2c, REG_CTRL1, CTRL1_BDU_4HZ)
}

// Polls the sensor's built-in presence and motion detection.
// `onPresence(true)` fires when someone appears and `onPresence(false)` once they
// have been gone for a few seconds; `onMotion()` fires when movement starts.
// `report` receives a short status text whenever the connection state changes.
export function startPresenceSensor({ onPresence, onMotion, report }) {
  if (!hasI2C()) return
  let i2c
  let connected
  let retryAt = 0
  let present
  let absentSince = 0
  let moving = false

  Timer.repeat(() => {
    const now = Date.now()
    if (!i2c && now < retryAt) return
    let flags
    try {
      i2c ??= openUnit(ADDRESS, setupSensor)
      flags = readRegister(i2c, REG_FUNC_STATUS)
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
      return
    }

    if (flags & FLAG_PRESENCE) {
      absentSince = 0
      if (present !== true) {
        present = true
        onPresence(true)
      }
    } else if (present !== false) {
      if (absentSince === 0) absentSince = now
      if (now - absentSince >= ABSENT_CONFIRM_MS) {
        present = false
        onPresence(false)
      }
    }

    const isMoving = (flags & FLAG_MOTION) !== 0
    if (isMoving && !moving) onMotion()
    moving = isMoving
  }, POLL_MS)
}
