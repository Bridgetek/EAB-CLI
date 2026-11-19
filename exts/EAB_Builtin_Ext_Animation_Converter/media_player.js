function pvStopPlayback() {
  if (state.playTimer) clearInterval(state.playTimer);
  state.playTimer = null;
  state.playing = false;
  const $btn = $('#pv-play');
  if ($btn.length) $btn.text('▶▶ Play');
}
