const { recordUsage } = require("../services/usageService");
const aiService = require("../services/aiService");

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
    res.json({ success: true, content });
  } catch (err) {
    next(err);
  }
};
