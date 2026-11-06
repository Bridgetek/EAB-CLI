<!DOCTYPE html>
<html lang="en">
<head>
<title>readme</title>
<style>

p {
  color: #2c3e50;
  font-family: Segoe UI,sans-serif;
  font-size: 13pt;
  text-align: justify;
  max-width: 700px;
}

h2 {
  font-family: Segoe UI,sans-serif;
  font-size: 14pt;
  color: #1a252f;
  max-width: 700px;
}

hr {
  max-width: 700px;
  border: none;
  border-top: 1px solid #bdc3c7;
  margin: 20px 0;
}

</style>
</head>
<body>

<p><strong>How to update Eve-connected Flash through Pico (through USB mass storage protocol)</strong></p>

<p>Make sure your Pico is connected with Eve properly:</p>

<p style="margin-left:40px">PICO GP2 &lt;&mdash;&gt; Eve SCK<br />
PICO GP3 &lt;&mdash;&gt; Eve MOSI &nbsp;&nbsp;<br />
PICO GP4 &lt;&mdash;&gt; Eve MISO &nbsp;&nbsp;<br />
PICO GP5 &lt;&mdash;&gt; Eve CS# &nbsp;&nbsp;<br />
&nbsp;&nbsp;<br />
PICO Power &lt;&mdash;&gt; Eve Board power &nbsp;&nbsp;<br />
PICO GND&nbsp; &nbsp;&lt;&mdash;&gt; Eve Board GND &nbsp;&nbsp;</p>

<p>It follows the pin map of BridgeTek MM2040EV board or GD3X dazzler for Pico. &nbsp;&nbsp;</p>

<hr />

<h2>Part 1 &mdash; Using EAB (Recommended)</h2>

<p>EAB automatically converts your <strong>.bin</strong> file to UF2 format behind the scene. You only need to provide the binary file and connect your Pico in bootloader mode.</p>

<p>1. Connect Pico with PC through USB while holding the <strong>BOOTSEL</strong> button.<br />
2. Wait till the USB drive <strong>&quot;RPI-RP2&quot;</strong> appears.<br />
3. In EAB, select your <strong>.bin</strong> file and start the flash operation.<br />
&nbsp;&nbsp;&nbsp;&nbsp;EAB will convert the .bin file to UF2 and program the Pico automatically.<br />
4. Wait for EAB to complete. <strong>DONE.</strong></p>

<p><strong>Note:</strong><br />
EAB handles all UF2 conversion and file transfer steps internally.<br />
&quot;eve_flash_pico.uf2&quot; is a pico program running from RAM. It is <strong>NOT</strong>&nbsp;programmed into Pico flash.<br />
&quot;eve_flash_pico.uf2&quot; is saved in &lt;EAB installation folder&gt;/pico</p>

<hr />

<h2>Part 2 &mdash; Manual (UF2 file)</h2>

<p>Use this method if you already have a UF2 file or prefer to perform the steps manually without EAB.</p>

<p>1. Connect Pico with PC through USB while holding the <strong>BOOTSEL</strong> button.<br />
2. Wait till the USB drive <strong>&quot;RPI-RP2&quot;</strong> appears.<br />
3. Drag and drop <strong>&quot;eve_flash_pico.uf2&quot;</strong> into the <strong>&quot;RPI-RP2&quot;</strong> drive. &nbsp;&nbsp;<br />
4. Wait till a new USB drive <strong>&quot;BTEVE-FLASH&quot;</strong> appears.<br />
5. Drag and drop your converted <strong>UF2</strong> file into <strong>&quot;BTEVE-FLASH&quot;</strong>.<br />
6. Wait till the UF2 is copied over. <strong>DONE.</strong>&nbsp;</p>

<p><strong>Note:</strong><br />
To convert a .bin file to UF2 manually, use the <strong>uf2conv4eve</strong> tool or EAB's built-in converter before following the steps above.<br />
&quot;eve_flash_pico.uf2&quot; is a pico program running from RAM. It is <strong>NOT</strong>&nbsp;programmed into Pico flash.<br />
&quot;eve_flash_pico.uf2&quot; is saved in &lt;EAB installation folder&gt;/pico</p>

</body>
</html>