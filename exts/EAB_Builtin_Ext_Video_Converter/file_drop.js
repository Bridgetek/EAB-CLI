function renderPickedFile(path) {
  const name = baseName(path);
  const folder = name && path.length > name.length ? path.slice(0, path.length - name.length - 1) : '';
  const ext = (name.match(/\.([^.]+)$/) || [null, ''])[1].toUpperCase();
  loadMediaPreview(path);
  const $preview = $('#preview');
  const $empty = $('#preview-empty');
  const $meta = $('#preview-meta');
  if ($empty.length) $empty.toggleClass('hidden', !!name);
  if ($meta.length) $meta.toggleClass('hidden', !name);
  if ($preview.length) $preview.toggleClass('has-file', !!name);
  if (name) {
    $('#pv-name').text(name);
    $('#pv-format').text(ext ? ext + ' video' : 'Video');
    $('#pv-folder').text(folder || '.');
  }
}
window.eabOnDrop = function (paths) {
  if (!paths || !paths.length) return;
  addInputFiles(paths);
};
