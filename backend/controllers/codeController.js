const Usage = require("../models/Usage");
const aiService = require("../services/aiService");

// POST /api/code/assist  { task, language, code, requestType }
// requestType: "generate" | "debug" | "explain" | "optimize"
exports.codeAssist = async (req, res, next) => {
  try {
    const { task, language, code, requestType } = req.body;
    if (!task || !language || !requestType) {
      return res.status(400).json({ success: false, message: "task, language and requestType are required" });
    }
    const content = await aiService.codeAssist(
      { task, language, code, requestType },
      req.user.preferredLanguage
    );
    await Usage.create({ user: req.user._id, action: "coding", meta: { language, requestType } });
    res.json({ success: true, content });
  } catch (err) {
    next(err);
  }
};
