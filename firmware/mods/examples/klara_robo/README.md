# Klara Robo

Klara is a personality MOD for M5StackChan: a smiling feminine face (lashes, blush, rose lips) with small idle expressions (grins, raised eyebrows, lip movements).

- Button A (M5Stack Unit Dual Button): nods the head twice.
- Button B: shows a rainbow arc with clouds on the screen for 3 seconds and says "hello rainbow!".
- Every 15 to 30 seconds she says one of 20 friendly phrases from `sayings.js`, shown in a balloon. Each phrase comes with matching body language from `gestures.js`: a face pose, a head move, hands, a floating effect, a light flash and a short tune.
- Every 4 to 7 seconds the head glances slightly to a random side, staying near the center.
- Tapping the face makes her say a short reaction, count down three seconds, take a photo with the built-in camera and show it for five seconds. The photo is kept in memory only and the camera is off the rest of the time.
- Stroking the touch strip on top of the body brings hearts and a happy sound.
- Shaking her, knocking her over or turning her upside down gets a dizzy, sad or surprised reaction.
- Her energy drains while she is ignored and each interaction tops it up. Low energy slows her down and brings yawns, and at zero she falls asleep; high energy sometimes makes her hum. Energy is capped during the night hours of the device clock.
- The head LEDs glow with her energy and flash with each gesture.
- Unit TMOS PIR (optional): she greets a person who arrives, says goodbye when they leave, falls asleep after two minutes alone, and perks up at nearby movement.
- Unit Digi-Clock (optional): shows running milliseconds, as one digit of seconds followed by three digits of milliseconds.

Speech is spelled in kana, because the bundled `stackchan-voice` engine is Japanese.

## Trying the reactions

"Next demo" in the host drawer plays the reactions one at a time, in a fixed order, without waiting for the real trigger.
In the browser simulator, button C does the same, and buttons A and B stand in for the Dual Button.

## Wiring

The unit drives one Grove signal wire per button, so it needs a port whose two pins are free as digital inputs.
It does not work through an I2C hub.

`mod.js` assumes CoreS3 Port B (G9 and G8).
Edit `PINS` at the top of `mod.js` for another port, and swap `a` and `b` to exchange the buttons.

The Digi-Clock and the TMOS PIR are I2C units and share one bus, looked for on Port A (G2 and G1) and Port C (G17 and G18).
To use both, plug them into a PaHub and the PaHub into either port.
The MOD still runs without them.

## Install

From the `firmware` directory:

```console
npm run mod -- mods/examples/klara_robo/manifest.json
```
