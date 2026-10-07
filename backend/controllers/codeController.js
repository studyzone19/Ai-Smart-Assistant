const { recordUsage } = require("../services/usageService");
const aiService = require("../services/aiService");

// POST /api/code/assist  { task, language, code, requestType }
// requestType: "generate" | "debug" | "explain" | "optimize"
exports.codeAssist = async (req, res, next) => {
  try {
    const { task, language, code, requestType } = req.body;
    const requestTypes = new Set(["generate", "debug", "explain", "optimize"]);
    const languages = new Set(["JavaScript", "TypeScript", "Python", "React", "Node.js", "HTML/CSS", "Java", "C++", "C", "SQL", "Go", "Rust"]);
    if (typeof task !== "string" || !task.trim() || task.length > 12000
      || !languages.has(language) || !requestTypes.has(requestType)
      || (code !== undefined && (typeof code !== "string" || code.length > 30000))) {
      return res.status(400).json({ success: false, message: "Enter a task (max 12,000 characters), choose a supported language and action, and keep pasted code under 30,000 characters." });
    }
    const content = await aiService.codeAssist(
      { task, language, code, requestType },
      req.user.preferredLanguage
    );
    await recordUsage(req.user._id, "coding", { language, requestType });
    res.json({ success: true, content });
  } catch (err) {
    next(err);
  }
};
