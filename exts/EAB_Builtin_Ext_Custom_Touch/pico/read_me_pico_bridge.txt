<!DOCTYPE html>
<html lang="en">
<head>
<title>Pico bridge</title>
<style>
p { color: #2c3e50; font-family: Segoe UI,sans-serif; font-size: 13pt; text-align: justify; max-width: 700px; }
h2 { font-family: Segoe UI,sans-serif; font-size: 14pt; color: #1a252f; max-width: 700px; }
hr { max-width: 700px; border: none; border-top: 1px solid #bdc3c7; margin: 20px 0; }
code { font-family: Consolas,monospace; font-size: 12pt; }
</style>
</head>
<body>

<p><strong>Raspberry Pi Pico as an EVE touch bridge</strong></p>

<p><code>eve_touch_bridge.uf2</code> turns a Pico into a USB CDC bridge that owns
the SPI bus to the EVE board. The Custom Touch Debug tab then drives the live
touch monitor, the firmware loader, calibration and the settings pages through
it, exactly as it does through an FT4222 or an MPSSE adapter.</p>

<h2>Wiring</h2>

<p style="margin-left:40px">
PICO GP2 &lt;&mdash;&gt; EVE SCK<br />
PICO GP3 &lt;&mdash;&gt; EVE MOSI<br />
PICO GP4 &lt;&mdash;&gt; EVE MISO<br />
PICO GP5 &lt;&mdash;&gt; EVE CS#<br />
PICO Power &lt;&mdash;&gt; EVE board power<br />
PICO GND &lt;&mdash;&gt; EVE board GND
</p>

<p>This is the pin map of the Bridgetek MM2040EV board and the GD3X dazzler.</p>

<hr />

<h2>Flashing the bridge (once)</h2>

<p>1. Hold <strong>BOOTSEL</strong> while plugging the Pico into the PC.<br />
2. Wait for the <strong>RPI-RP2</strong> drive to appear.<br />
3. Drag <code>eve_touch_bridge.uf2</code> onto that drive.<br />
4. The Pico reboots and a serial port named <strong>EVE Touch Bridge</strong>
appears. <strong>DONE.</strong></p>

<p>The bridge is programmed into the Pico's own flash, so this is a one-time
step. Afterwards the Pico enumerates as a serial port on every plug-in and no
BOOTSEL is needed.</p>

<hr />

<h2>Using it in EAB</h2>

<p>1. Open <strong>Custom Touch &rarr; Debug</strong>.<br />
2. Press <strong>Scan</strong>. The Pico row shows the bridge port and its
firmware version.<br />
3. Press <strong>Connect</strong> on the Pico row. The board is booted and the
chip is detected.<br />
4. Start the monitor, load firmware or calibrate as usual.</p>

<p><strong>Note:</strong> the Pico bridge and the FTDI adapters are mutually
exclusive — only one transport drives the board at a time. Selecting the Pico
closes any open FT4222/MPSSE session.</p>

</body>
</html>
