const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "My Resume" },
    personalInfo: {
      fullName: String,
      email: String,
      phone: String,
      location: String,
      linkedin: String,
      github: String,
      portfolio: String,
    },
    summary: String,
    education: [
      { degree: String, institution: String, year: String, score: String },
    ],
    skills: [String],
    projects: [
      { name: String, description: String, techStack: [String], link: String },
    ],
    experience: [
      { role: String, company: String, duration: String, description: String },
    ],
    certifications: [String],
    achievements: [String],
    generatedSummary: String,
    generatedCoverLetter: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resume", resumeSchema);
