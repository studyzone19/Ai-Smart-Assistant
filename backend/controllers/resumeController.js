const Resume = require("../models/Resume");
const { recordUsage } = require("../services/usageService");
const aiService = require("../services/aiService");

// GET /api/resume
exports.listResumes = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ user: req.user._id }).sort({ updatedAt: -1 });
    res.json({ success: true, resumes });
  } catch (err) {
    next(err);
  }
};

// POST /api/resume  (create/update full resume data)
exports.saveResume = async (req, res, next) => {
  try {
    const resumeId = req.body.id || req.body._id;
    const allowedFields = [
      "title", "personalInfo", "summary", "education", "skills", "projects",
      "experience", "certifications", "achievements", "generatedSummary", "generatedCoverLetter",
    ];
    const data = Object.fromEntries(allowedFields
      .filter((field) => req.body[field] !== undefined)
      .map((field) => [field, req.body[field]]));
    let resume;
    if (resumeId) {
      resume = await Resume.findOneAndUpdate({ _id: resumeId, user: req.user._id }, { $set: data }, { new: true, runValidators: true });
      if (!resume) return res.status(404).json({ success: false, message: "Resume not found" });
    } else {
      resume = await Resume.create({ ...data, user: req.user._id });
    }
    res.status(resumeId ? 200 : 201).json({ success: true, resume });
  } catch (err) {
    next(err);
  }
};

// POST /api/resume/:id/generate  { section: "summary" | "projectDescriptions" | "coverLetter" | "linkedinSummary" }
exports.generateSection = async (req, res, next) => {
  try {
    const { section } = req.body;
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return res.status(404).json({ success: false, message: "Resume not found" });

    const sectionPrompts = {
      summary: "a 3-4 sentence professional summary for the top of the resume",
      projectDescriptions: "ATS-friendly bullet-point descriptions (2-3 bullets each) for every project listed",
      coverLetter: "a complete, tailored cover letter (250-350 words)",
      linkedinSummary: "a LinkedIn 'About' section (around 150 words, first person, engaging tone)",
    };
    const instruction = sectionPrompts[section];
    if (!instruction) return res.status(400).json({ success: false, message: "Invalid section" });

    const generated = await aiService.generateResumeContent(resume.toObject(), instruction);

    if (section === "summary") resume.generatedSummary = generated;
    if (section === "coverLetter") resume.generatedCoverLetter = generated;
    await resume.save();

    await recordUsage(req.user._id, "resume", { section });
    res.json({ success: true, generated, resume });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/resume/:id
exports.deleteResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!resume) return res.status(404).json({ success: false, message: "Resume not found" });
    res.json({ success: true, message: "Resume deleted" });
  } catch (err) {
    next(err);
  }
};
