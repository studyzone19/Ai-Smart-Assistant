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
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: "Memory content is required" });
    }
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
    if (content !== undefined) memory.content = content;
    if (category !== undefined) memory.category = category;
    if (isActive !== undefined) memory.isActive = isActive;
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
    req.user.memoryEnabled = !!enabled;
    await req.user.save();
    res.json({ success: true, memoryEnabled: req.user.memoryEnabled });
  } catch (err) {
    next(err);
  }
};
