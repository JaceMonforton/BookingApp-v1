const { sendError } = require('../utils/response');

function validateBody(schema) {
  return (req, res, next) => {
    const r = schema.safeParse(req.body);
    if (!r.success) {
      const msg = r.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
      return sendError(res, msg, 400);
    }
    req.body = r.data;
    next();
  };
}

module.exports = { validateBody };
