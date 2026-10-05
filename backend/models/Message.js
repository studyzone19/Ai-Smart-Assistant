const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    content: { type: String, required: true },
    sources: [{ title: String, url: String }],
    language: { type: String, enum: ["english", "hindi", "hinglish"], default: "english" },
    model: { type: String, default: "gemini-3.5-flash-lite" },
    isWebSearch: { type: Boolean, default: false },
    editedFrom: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
