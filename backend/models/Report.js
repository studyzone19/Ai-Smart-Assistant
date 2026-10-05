const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    topic: { type: String, required: true },
    type: {
      type: String,
      enum: ["project", "college", "technical", "business", "research"],
      default: "project",
    },
    content: {
      introduction: String,
      objectives: String,
      methodology: String,
      analysis: String,
      findings: String,
      conclusion: String,
      futureScope: String,
    },
    rawMarkdown: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
