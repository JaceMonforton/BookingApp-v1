function sendSuccess(res, data = null, status = 200) {
  return res.status(status).json({ success: true, data, error: null });
}

function sendError(res, error, status = 400) {
  const message = typeof error === 'string' ? error : error?.message || 'Request failed';
  return res.status(status).json({ success: false, data: null, error: message });
}

module.exports = { sendSuccess, sendError };
