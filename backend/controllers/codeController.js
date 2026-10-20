const { recordUsage } = require("../services/usageService");
const aiService = require("../services/aiService");
const Chat = require("../models/Chat");
const Message = require("../models/Message");

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

    // Save automatically to Chat History
    try {
      const chatTitle = `[Code] ${language}: ${task}`.slice(0, 60);
      const chat = await Chat.create({
        user: req.user._id,
        title: chatTitle,
        mode: "coding"
      });
      const userMessageContent = code 
        ? `Task: ${task}\nLanguage: ${language}\nAction: ${requestType}\n\n\`\`\`${language}\n${code}\n\`\`\``
        : `Task: ${task}\nLanguage: ${language}\nAction: ${requestType}`;

      await Message.create([
        {
          chat: chat._id,
          user: req.user._id,
          role: "user",
          content: userMessageContent
        },
        {
          chat: chat._id,
          user: req.user._id,
          role: "assistant",
          content
        }
      ]);
    } catch (saveErr) {
      console.error("Failed to save coding chat history:", saveErr);
    }

    res.json({ success: true, content });
  } catch (err) {
    next(err);
  }
};
