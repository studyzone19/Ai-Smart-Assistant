const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
    originalName: { type: String, required: true },
    storedPath: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    fullText: { type: String, default: "" },
    isTruncated: { type: Boolean, default: false },
    chunks: [
      {
        index: Number,
        text: String,
      },
    ],
    status: { type: String, enum: ["processing", "ready", "failed"], default: "processing" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);
