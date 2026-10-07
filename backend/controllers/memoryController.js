const Memory = require("../models/Memory");

// GET /api/memory
exports.listMemories = async (req, res, next) => {
  try {
    const memories = await Memory.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, memories, memoryEnabled: req.user.memoryEnabled });
  } catch (err) {
    next(err);
  }
};

// POST /api/memory  { content, category }
exports.addMemory = async (req, res, next) => {
  try {
    const { content, category } = req.body;
    if (typeof content !== "string" || !content.trim() || content.length > 2000) {
      return res.status(400).json({ success: false, message: "Memory must contain 1–2,000 characters." });
    }
    if (category && !["preference", "project", "language", "skill", "other"].includes(category)) return res.status(400).json({ success: false, message: "Choose a valid memory category." });
    const memory = await Memory.create({
      user: req.user._id,
      content: content.trim(),
      category: category || "other",
      source: "user",
    });
    res.status(201).json({ success: true, memory });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/memory/:id
exports.updateMemory = async (req, res, next) => {
  try {
    const { content, category, isActive } = req.body;
    const memory = await Memory.findOne({ _id: req.params.id, user: req.user._id });
    if (!memory) return res.status(404).json({ success: false, message: "Memory not found" });
    if (content !== undefined) {
      if (typeof content !== "string" || !content.trim() || content.length > 2000) return res.status(400).json({ success: false, message: "Memory must contain 1–2,000 characters." });
      memory.content = content.trim();
    }
    if (category !== undefined) {
      if (!["preference", "project", "language", "skill", "other"].includes(category)) return res.status(400).json({ success: false, message: "Choose a valid memory category." });
      memory.category = category;
    }
    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") return res.status(400).json({ success: false, message: "Memory status must be true or false." });
      memory.isActive = isActive;
    }
    await memory.save();
    res.json({ success: true, memory });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/memory/:id
exports.deleteMemory = async (req, res, next) => {
  try {
    const memory = await Memory.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!memory) return res.status(404).json({ success: false, message: "Memory not found" });
    res.json({ success: true, message: "Memory deleted" });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/memory  (clear all)
exports.clearAllMemories = async (req, res, next) => {
  try {
    await Memory.deleteMany({ user: req.user._id });
    res.json({ success: true, message: "All memories cleared" });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/memory/toggle  { enabled }
exports.toggleMemory = async (req, res, next) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== "boolean") return res.status(400).json({ success: false, message: "Memory setting must be true or false." });
    req.user.memoryEnabled = enabled;
    await req.user.save();
    res.json({ success: true, memoryEnabled: req.user.memoryEnabled });
  } catch (err) {
    next(err);
  }
};
