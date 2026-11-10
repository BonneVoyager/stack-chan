// External I2C units share one bus: the ESP32-S3 has two I2C controllers and the
// host uses one for the CoreS3's internal devices. To use several units at once,
// plug them into a PaHub; this module opens all of its channels so the units
// behind it appear on the bus directly.
//
// The bus is looked for on Port A and on Port C, so the units (or the hub) can
// be in either socket. Port B is left to the Dual Button.
const BUSES = [
  { data: 2, clock: 1 },
  { data: 17, clock: 18 },
]
const HZ = 100_000
const HUB_ADDRESS = 0x70
const HUB_ALL_CHANNELS = 0xff

let activeBus
let openUnits = 0

function enableHub(I2C, bus) {
  let hub
  try {
    hub = new I2C({ ...bus, address: HUB_ADDRESS, hz: HZ })
    hub.write(Uint8Array.of(HUB_ALL_CHANNELS))
  } catch {
    // No hub on this bus; units may still be connected directly.
  } finally {
    hub?.close()
  }
}

// The browser simulator has no I2C.
export function hasI2C() {
  return globalThis.device?.io?.I2C !== undefined
}

// Opens the unit at `address` and runs `setup` on it. `setup` must throw when the
// unit does not answer, so the next bus can be tried.
export function openUnit(address, setup) {
  const I2C = device.io.I2C
  let lastError
  for (const bus of activeBus ? [activeBus] : BUSES) {
    enableHub(I2C, bus)
    let i2c
    try {
      i2c = new I2C({ ...bus, address, hz: HZ })
      setup(i2c)
      activeBus = bus
      openUnits++
      return i2c
    } catch (error) {
      i2c?.close()
      lastError = error
    }
  }
  throw lastError
}

export function closeUnit(i2c) {
  i2c.close()
  openUnits--
  if (openUnits === 0) activeBus = undefined
}
