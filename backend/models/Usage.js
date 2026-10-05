const mongoose = require("mongoose");

const usageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: {
      type: String,
      enum: [
        "chat", "study", "coding", "document_upload", "document_qa",
        "web_search", "resume", "report", "login", "register",
      ],
      required: true,
    },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Usage", usageSchema);
