window.eabOnDrop = function (paths) {
  if (paths && paths.length) addGifFiles(paths.map(p => String(p || '')).filter(Boolean));
};
