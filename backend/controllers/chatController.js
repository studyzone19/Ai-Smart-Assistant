const Chat = require("../models/Chat");
const Message = require("../models/Message");
const Memory = require("../models/Memory");
const { recordUsage } = require("../services/usageService");
const aiService = require("../services/aiService");
const fs = require("fs");

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
    const messages = await Message.find({ chat: chat._id }).select("+attachmentPath");
    messages.forEach((message) => {
      if (message.attachmentPath && fs.existsSync(message.attachmentPath)) fs.unlinkSync(message.attachmentPath);
    });
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
    if (title !== undefined && (typeof title !== "string" || !title.trim() || title.trim().length > 80)) return res.status(400).json({ success: false, message: "Chat title must be 1–80 characters." });
    if (isPinned !== undefined && typeof isPinned !== "boolean") return res.status(400).json({ success: false, message: "Pinned status must be true or false." });
    const chat = await Chat.findOne({ _id: req.params.id, user: req.user._id });
    if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });
    if (title !== undefined) chat.title = title.trim();
    if (isPinned !== undefined) chat.isPinned = isPinned;
    await chat.save();
    res.json({ success: true, chat });
  } catch (err) {
    next(err);
  }
};

// POST /api/chats/:id/messages  { content, model, isWebSearch }
exports.sendMessage = async (req, res, next) => {
  const createdMessageIds = [];
  try {
    const { content, model: selectedModel, isWebSearch } = req.body;
    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ success: false, message: "Message content is required" });
    }
    if (content.length > 12000) {
      return res.status(413).json({ success: false, message: "Messages must be 12,000 characters or fewer." });
    }

    const chat = await Chat.findOne({ _id: req.params.id, user: req.user._id });
    if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });

    const userMessage = await Message.create({
      chat: chat._id,
      user: req.user._id,
      role: "user",
      content,
      model: selectedModel || "gemini-3.5-flash-lite",
      isWebSearch: isWebSearch === true,
      language: req.user.preferredLanguage,
    });
    createdMessageIds.push(userMessage._id);

    // Auto-title the chat from the first message
    if (chat.title === "New Chat") {
      chat.title = content.slice(0, 60);
    }

    // Build conversation history for the model
    const historyQuery = Message.find({ chat: chat._id }).sort({ createdAt: -1 }).limit(16);
    const memoriesQuery = req.user.memoryEnabled
      ? Memory.find({ user: req.user._id, isActive: true }).limit(10)
      : Promise.resolve([]);
    const [history, memories] = await Promise.all([historyQuery, memoriesQuery]);
    history.reverse();
    const formattedHistory = history.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));

    // Pull active memories to ground responses in user context
    const memoryContext = memories.length
      ? `\n\n[Known user context from memory]\n${memories.map((m) => `- ${m.content}`).join("\n")}`
      : "";

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
    createdMessageIds.push(assistantMessage._id);

    chat.updatedAt = new Date();
    await chat.save();
    await recordUsage(req.user._id, "chat", { chatId: chat._id });

    res.json({ success: true, userMessage, assistantMessage });
  } catch (err) {
    if (createdMessageIds.length) {
      await Message.deleteMany({ _id: { $in: createdMessageIds } }).catch((cleanupErr) => {
        console.error("Could not clean up failed chat messages:", cleanupErr.message);
      });
    }
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
    }).sort({ createdAt: -1 }).limit(16);
    historyBefore.reverse();

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
    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ success: false, message: "Content cannot be empty" });
    }
    if (content.length > 12000) {
      return res.status(413).json({ success: false, message: "Messages must be 12,000 characters or fewer." });
    }
    const chat = await Chat.findOne({ _id: req.params.id, user: req.user._id });
    if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });

    const targetUserMsg = await Message.findOne({ _id: messageId, chat: chat._id, role: "user" });
    if (!targetUserMsg) return res.status(404).json({ success: false, message: "User message not found" });

    // Prepare a revised history without changing saved messages yet. This keeps the
    // existing reply/conversation intact if the AI provider is unavailable.
    const history = await Message.find({
      chat: chat._id,
      createdAt: { $lte: targetUserMsg.createdAt },
    }).sort({ createdAt: -1 }).limit(16);
    history.reverse();

    const formattedHistory = history.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m._id.equals(targetUserMsg._id) ? content.trim() : m.content,
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

    // Commit the edit only after a replacement answer was generated successfully.
    const supersededMessages = await Message.find({
      chat: chat._id,
      createdAt: { $gt: targetUserMsg.createdAt },
    }).select("+attachmentPath");
    for (const message of supersededMessages) {
      if (message.attachmentPath && fs.existsSync(message.attachmentPath)) fs.unlinkSync(message.attachmentPath);
    }
    await Message.deleteMany({ _id: { $in: supersededMessages.map((message) => message._id) } });
    targetUserMsg.content = content.trim();
    await targetUserMsg.save();

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
    const chat = await Chat.findOne({ _id: req.params.id, user: req.user._id });
    if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });
    const msg = await Message.findOne({ _id: req.params.messageId, chat: chat._id, user: req.user._id }).select("+attachmentPath");
    if (!msg) return res.status(404).json({ success: false, message: "Message not found" });
    if (msg.attachmentPath && fs.existsSync(msg.attachmentPath)) fs.unlinkSync(msg.attachmentPath);
    await msg.deleteOne();
    res.json({ success: true, message: "Message deleted" });
  } catch (err) {
    next(err);
  }
};
