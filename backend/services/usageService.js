const Usage = require("../models/Usage");

async function recordUsage(user, action, meta = {}) {
  try {
    await Usage.create({ user, action, meta });
  } catch (err) {
    // Analytics should never turn a successful user action into a failed request.
    console.error(`Could not record ${action} usage:`, err.message);
  }
}

module.exports = { recordUsage };
