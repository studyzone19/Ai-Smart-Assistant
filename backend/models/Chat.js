const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "New Chat" },
    mode: {
      type: String,
      enum: ["chat", "study", "coding", "document", "resume", "report"],
      default: "chat",
    },
    isPinned: { type: Boolean, default: false },
    isDeletedByUser: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", chatSchema);
