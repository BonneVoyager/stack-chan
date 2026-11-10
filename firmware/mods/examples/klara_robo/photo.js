import { createCameraPreviewDialog, prepareCameraPreviewFrame } from 'camera-preview'
import config from 'mc/config'
import Timer from 'timer'

// The host's own camera preview captures at the sensor's native QQVGA size, in
// the display's pixel order so the frame can be drawn without conversion.
const CAPTURE = {
  width: 160,
  height: 120,
  imageType: config.format === 'RGB565BE' ? 'rgb565be' : 'rgb565le',
}
// The host stops the camera only after the preview has had time to paint.
const STOP_DELAY_MS = 120

function delay(ms) {
  return new Promise((resolve) => Timer.set(resolve, ms))
}

// Takes one picture and shows it in the host's full-screen camera preview, with
// `caption` under it. `onDismiss` is called when the preview is tapped.
// Resolves to false when the camera gave no picture. The picture stays in
// memory only; the camera is switched off again right after the shot.
// Restore the face afterwards with robot.ui.showFace().
export async function showPhoto(robot, { caption, onDismiss }) {
  const camera = robot.camera
  if (!camera || camera.available === false) return false
  let frame
  try {
    await camera.start(CAPTURE)
    frame = await camera.capture(CAPTURE)
    if (!frame) return false
    robot.ui.setMain(createCameraPreviewDialog(prepareCameraPreviewFrame(frame), { caption, onDismiss }))
    return true
  } finally {
    frame?.close?.()
    await delay(STOP_DELAY_MS)
    try {
      await camera.stop()
    } catch (error) {
      trace(`klara robo: camera stop failed ${error}\n`)
    }
  }
}
