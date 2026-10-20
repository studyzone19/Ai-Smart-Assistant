const { recordUsage } = require("../services/usageService");
const aiService = require("../services/aiService");
const Chat = require("../models/Chat");
const Message = require("../models/Message");

// POST /api/study/generate  { subject, topic, level, difficulty, requestType }
// requestType: "notes" | "important_questions" | "mcqs" | "flashcards" | "revision" | "practice_test"
exports.generateStudyContent = async (req, res, next) => {
  try {
    const { subject, topic, level, difficulty, requestType } = req.body;
    const requestTypes = new Set(["notes", "important_questions", "mcqs", "flashcards", "revision", "practice_test"]);
    const levels = new Set(["school", "undergraduate", "postgraduate"]);
    const difficulties = new Set(["easy", "medium", "hard"]);
    if (typeof subject !== "string" || !subject.trim() || subject.length > 200
      || typeof topic !== "string" || !topic.trim() || topic.length > 300
      || !requestTypes.has(requestType)
      || (level && !levels.has(level))
      || (difficulty && !difficulties.has(difficulty))) {
      return res.status(400).json({ success: false, message: "Enter a subject (max 200 characters), a topic (max 300 characters), and choose a valid output format, level, and difficulty." });
    }
    const content = await aiService.studyAssist(
      { subject, topic, level, difficulty, requestType },
      req.user.preferredLanguage
    );
    await recordUsage(req.user._id, "study", { subject, topic, requestType });

    // Save automatically to Chat History
    try {
      const chatTitle = `[Study] ${subject}: ${topic}`.slice(0, 60);
      const chat = await Chat.create({
        user: req.user._id,
        title: chatTitle,
        mode: "study"
      });
      await Message.create([
        {
          chat: chat._id,
          user: req.user._id,
          role: "user",
          content: `Subject: ${subject}\nTopic: ${topic}\nFormat: ${requestType}\nLevel: ${level || "undergraduate"}`
        },
        {
          chat: chat._id,
          user: req.user._id,
          role: "assistant",
          content
        }
      ]);
    } catch (saveErr) {
      console.error("Failed to save study chat history:", saveErr);
    }

    res.json({ success: true, content });
  } catch (err) {
    next(err);
  }
};
