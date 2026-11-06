function runCli(args) {
  if (!isEmbedded()) {
    return Promise.reject(new Error('Session actions require the EAB host.'));
  }
  return API_EAB_runCli({ command: EXT_ID, args: args }).then(resp => {
    if (!resp.ok) throw new Error(resp.error || 'Command failed');
    let parsed;
    try {
      parsed = JSON.parse(resp.detail);
    } catch (e) {
      parsed = { success: true };
    }
    if (parsed && parsed.success === false) {
      const err = new Error(parsed.error || 'Command failed');
      err.result = parsed;
      throw err;
    }
    return parsed;
  });
}
