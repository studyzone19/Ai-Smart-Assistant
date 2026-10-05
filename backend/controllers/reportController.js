const Report = require("../models/Report");
const Usage = require("../models/Usage");
const aiService = require("../services/aiService");

// POST /api/reports/generate  { topic, type, notes }
exports.generateReport = async (req, res, next) => {
  try {
    const { topic, type, notes } = req.body;
    if (!topic) return res.status(400).json({ success: false, message: "topic is required" });

    const content = await aiService.generateReport({ topic, type: type || "project", notes });

    const report = await Report.create({
      user: req.user._id,
      topic,
      type: type || "project",
      content,
    });

    await Usage.create({ user: req.user._id, action: "report", meta: { topic, type } });
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
