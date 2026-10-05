const Usage = require("../models/Usage");
const aiService = require("../services/aiService");

// POST /api/study/generate  { subject, topic, level, difficulty, requestType }
// requestType: "notes" | "important_questions" | "mcqs" | "flashcards" | "revision" | "practice_test"
exports.generateStudyContent = async (req, res, next) => {
  try {
    const { subject, topic, level, difficulty, requestType } = req.body;
    if (!subject || !topic || !requestType) {
      return res.status(400).json({ success: false, message: "subject, topic and requestType are required" });
    }
    const content = await aiService.studyAssist(
      { subject, topic, level, difficulty, requestType },
      req.user.preferredLanguage
    );
    await Usage.create({ user: req.user._id, action: "study", meta: { subject, topic, requestType } });
    res.json({ success: true, content });
  } catch (err) {
    next(err);
  }
};
