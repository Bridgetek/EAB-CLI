function formatBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1024 / 1024).toFixed(2) + ' MB';
}
function parseWavHeader(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tag = (at) => String.fromCharCode(view.getUint8(at), view.getUint8(at + 1), view.getUint8(at + 2), view.getUint8(at + 3));
  if (bytes.byteLength < 44 || tag(0) !== 'RIFF' || tag(8) !== 'WAVE') return null;
  const info = { audioFormat: 1, channels: 1, sampleRate: 44100, bitsPerSample: 16, dataOffset: 0, dataLength: 0 };
  let at = 12;
  while (at + 8 <= bytes.byteLength) {
    const id = tag(at);
    const size = view.getUint32(at + 4, true);
    const body = at + 8;
    if (id === 'fmt ' && body + 16 <= bytes.byteLength) {
      info.audioFormat = view.getUint16(body, true);
      info.channels = view.getUint16(body + 2, true) || 1;
      info.sampleRate = view.getUint32(body + 4, true) || 44100;
      info.bitsPerSample = view.getUint16(body + 14, true) || 16;
      if (info.audioFormat === 0xFFFE && body + 26 <= bytes.byteLength) {
        info.audioFormat = view.getUint16(body + 24, true) || info.audioFormat;
      }
    } else if (id === 'data') {
      info.dataOffset = body;
      info.dataLength = Math.min(size, bytes.byteLength - body);
      break;
    }
    at = body + size + (size % 2);
  }
  if (!info.dataOffset) return null;
  const frameBytes = Math.max(1, (info.bitsPerSample / 8) * info.channels);
  info.frames = Math.floor(info.dataLength / frameBytes);
  info.duration = info.frames / info.sampleRate;
  return info;
}
