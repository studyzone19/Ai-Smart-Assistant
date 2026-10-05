const mongoose = require("mongoose");

const memorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    content: { type: String, required: true },
    category: {
      type: String,
      enum: ["preference", "project", "language", "skill", "other"],
      default: "other",
    },
    source: { type: String, enum: ["user", "auto"], default: "user" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Memory", memorySchema);
