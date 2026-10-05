const Chat = require("../models/Chat");
const Message = require("../models/Message");
const Memory = require("../models/Memory");
const Usage = require("../models/Usage");
const aiService = require("../services/aiService");

// GET /api/chats
exports.listChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({ user: req.user._id }).sort({ isPinned: -1, updatedAt: -1 });
    res.json({ success: true, chats });
  } catch (err) {
    next(err);
  }
};

// POST /api/chats
exports.createChat = async (req, res, next) => {
  try {
    const { title, mode } = req.body;
    const chat = await Chat.create({ user: req.user._id, title: title || "New Chat", mode: mode || "chat" });
    res.status(201).json({ success: true, chat });
  } catch (err) {
    next(err);
  }
};

// GET /api/chats/:id/messages
exports.getMessages = async (req, res, next) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, user: req.user._id });
    if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });
    const messages = await Message.find({ chat: chat._id }).sort({ createdAt: 1 });
    res.json({ success: true, chat, messages });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/chats/:id
exports.deleteChat = async (req, res, next) => {
  try {
    const chat = await Chat.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });
    await Message.deleteMany({ chat: chat._id });
    res.json({ success: true, message: "Chat deleted" });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/chats/:id
exports.updateChat = async (req, res, next) => {
  try {
    const { title, isPinned } = req.body;
    const chat = await Chat.findOne({ _id: req.params.id, user: req.user._id });
    if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });
    if (title !== undefined) chat.title = title;
    if (isPinned !== undefined) chat.isPinned = isPinned;
    await chat.save();
    res.json({ success: true, chat });
  } catch (err) {
    next(err);
  }
};

// POST /api/chats/:id/messages  { content, model, isWebSearch }
exports.sendMessage = async (req, res, next) => {
  try {
    const { content, model: selectedModel, isWebSearch } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: "Message content is required" });
    }

    const chat = await Chat.findOne({ _id: req.params.id, user: req.user._id });
    if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });

    const userMessage = await Message.create({
      chat: chat._id,
      user: req.user._id,
      role: "user",
      content,
      model: selectedModel || "gemini-3.5-flash-lite",
      isWebSearch: !!isWebSearch,
      language: req.user.preferredLanguage,
    });

    // Auto-title the chat from the first message
    if (chat.title === "New Chat") {
      chat.title = content.slice(0, 60);
    }

    // Build conversation history for the model
    const history = await Message.find({ chat: chat._id }).sort({ createdAt: 1 }).limit(30);
    const formattedHistory = history.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));

    // Pull active memories to ground responses in user context
    let memoryContext = "";
    if (req.user.memoryEnabled) {
      const memories = await Memory.find({ user: req.user._id, isActive: true }).limit(20);
      if (memories.length) {
        memoryContext = `\n\n[Known user context from memory]\n${memories.map((m) => `- ${m.content}`).join("\n")}`;
      }
    }

    const aiInput = memoryContext
      ? [...formattedHistory.slice(0, -1), { role: "user", content: `${content}${memoryContext}` }]
      : formattedHistory;

    const { reply, sources } = await aiService.chatCompletion(
      aiInput,
      req.user.preferredLanguage,
      selectedModel,
      isWebSearch
    );

    const assistantMessage = await Message.create({
      chat: chat._id,
      user: req.user._id,
      role: "assistant",
      content: reply,
      sources: sources || [],
      model: selectedModel || "gemini-3.5-flash-lite",
      language: req.user.preferredLanguage,
    });

    chat.updatedAt = new Date();
    await chat.save();
    await Usage.create({ user: req.user._id, action: "chat", meta: { chatId: chat._id } });

    res.json({ success: true, userMessage, assistantMessage });
  } catch (err) {
    next(err);
  }
};

// POST /api/chats/:id/regenerate  { messageId }
exports.regenerateMessage = async (req, res, next) => {
  try {
    const { messageId } = req.body;
    const chat = await Chat.findOne({ _id: req.params.id, user: req.user._id });
    if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });

    const target = await Message.findOne({ _id: messageId, chat: chat._id, role: "assistant" });
    if (!target) return res.status(404).json({ success: false, message: "Assistant message not found" });

    const historyBefore = await Message.find({
      chat: chat._id,
      createdAt: { $lt: target.createdAt },
    }).sort({ createdAt: 1 });

    const formattedHistory = historyBefore.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));

    const reply = await aiService.chatCompletion(formattedHistory, req.user.preferredLanguage);
    target.content = reply;
    await target.save();

    res.json({ success: true, message: target });
  } catch (err) {
    next(err);
  }
};

// POST /api/chats/:id/edit-message  { messageId, content }
exports.editMessage = async (req, res, next) => {
  try {
    const { messageId, content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: "Content cannot be empty" });
    }
    const chat = await Chat.findOne({ _id: req.params.id, user: req.user._id });
    if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });

    const targetUserMsg = await Message.findOne({ _id: messageId, chat: chat._id, role: "user" });
    if (!targetUserMsg) return res.status(404).json({ success: false, message: "User message not found" });

    // Update target message
    targetUserMsg.content = content.trim();
    await targetUserMsg.save();

    // Delete all messages created AFTER this message (ChatGPT conversation rewind)
    await Message.deleteMany({
      chat: chat._id,
      createdAt: { $gt: targetUserMsg.createdAt },
    });

    // Build history up to and including targetUserMsg
    const history = await Message.find({
      chat: chat._id,
      createdAt: { $lte: targetUserMsg.createdAt },
    }).sort({ createdAt: 1 });

    const formattedHistory = history.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));

    // Memory context if enabled
    let memoryContext = "";
    if (req.user.memoryEnabled) {
      const memories = await Memory.find({ user: req.user._id, isActive: true }).limit(20);
      if (memories.length) {
        memoryContext = `\n\n[Known user context from memory]\n${memories.map((m) => `- ${m.content}`).join("\n")}`;
      }
    }

    const aiInput = memoryContext
      ? [...formattedHistory.slice(0, -1), { role: "user", content: `${content.trim()}${memoryContext}` }]
      : formattedHistory;

    const reply = await aiService.chatCompletion(aiInput, req.user.preferredLanguage);

    const assistantMessage = await Message.create({
      chat: chat._id,
      user: req.user._id,
      role: "assistant",
      content: reply,
      language: req.user.preferredLanguage,
    });

    chat.updatedAt = new Date();
    await chat.save();

    res.json({ success: true, updatedUserMessage: targetUserMsg, assistantMessage });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/chats/:id/messages/:messageId
exports.deleteMessage = async (req, res, next) => {
  try {
    const msg = await Message.findOneAndDelete({ _id: req.params.messageId, user: req.user._id });
    if (!msg) return res.status(404).json({ success: false, message: "Message not found" });
    res.json({ success: true, message: "Message deleted" });
  } catch (err) {
    next(err);
  }
};

