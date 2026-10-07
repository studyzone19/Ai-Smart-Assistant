const Report = require("../models/Report");
const { recordUsage } = require("../services/usageService");
const aiService = require("../services/aiService");

// POST /api/reports/generate  { topic, type, notes }
exports.generateReport = async (req, res, next) => {
  try {
    const { topic, type, notes } = req.body;
    const reportTypes = new Set(["project", "college", "technical", "business", "research"]);
    if (typeof topic !== "string" || !topic.trim() || topic.length > 300
      || (notes !== undefined && (typeof notes !== "string" || notes.length > 10000))
      || !reportTypes.has(type || "project")) {
      return res.status(400).json({ success: false, message: "Provide a topic up to 300 characters, valid report type, and notes up to 10,000 characters." });
    }

    const content = await aiService.generateReport({ topic, type: type || "project", notes }, req.user.preferredLanguage);

    const report = await Report.create({
      user: req.user._id,
      topic,
      type: type || "project",
      content,
    });

    await recordUsage(req.user._id, "report", { topic, type });
    res.status(201).json({ success: true, report });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports
exports.listReports = async (req, res, next) => {
  try {
    const reports = await Report.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, reports });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/reports/:id
exports.deleteReport = async (req, res, next) => {
  try {
    const report = await Report.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!report) return res.status(404).json({ success: false, message: "Report not found" });
    res.json({ success: true, message: "Report deleted" });
  } catch (err) {
    next(err);
  }
};
