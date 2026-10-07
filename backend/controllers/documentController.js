const path = require("path");
const fs = require("fs");
const Document = require("../models/Document");
const { recordUsage } = require("../services/usageService");
const { extractText, extractPdf, chunkText, retrieveRelevantChunks } = require("../services/pdfService");
const aiService = require("../services/aiService");
const Chat = require("../models/Chat");
const Message = require("../models/Message");

const MIME_BY_EXTENSION = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".csv": "text/csv", ".json": "application/json", ".html": "text/html", ".htm": "text/html",
  ".xml": "application/xml", ".md": "text/markdown", ".yaml": "text/yaml", ".yml": "text/yaml",
  ".txt": "text/plain", ".log": "text/plain", ".js": "text/plain", ".jsx": "text/plain",
  ".ts": "text/plain", ".tsx": "text/plain", ".py": "text/plain", ".java": "text/plain",
  ".c": "text/plain", ".cpp": "text/plain", ".h": "text/plain", ".css": "text/plain", ".sql": "text/plain",
};
const getSafeMimeType = (file) => MIME_BY_EXTENSION[path.extname(file.originalname).toLowerCase()] || "application/octet-stream";

// POST /api/documents/upload  (multipart, field: file)
exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    const doc = await Document.create({
      user: req.user._id,
      originalName: req.file.originalname,
      storedPath: req.file.path,
      mimeType: getSafeMimeType(req.file),
      sizeBytes: req.file.size,
      status: "processing",
    });

    try {
      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      let text;
      let pdfPageCount = 0;
      if (fileExtension === ".pdf") {
        const pdf = await extractPdf(req.file.path);
        text = pdf.text;
        pdfPageCount = pdf.pageCount;
      } else {
        text = await extractText(req.file.path, getSafeMimeType(req.file));
      }
      if (fileExtension === ".pdf" && text.trim().length < Math.max(40, pdfPageCount * 80)) {
        text = await aiService.extractPdfText({ base64Data: fs.readFileSync(req.file.path, "base64") }, req.user.preferredLanguage);
      }
      if (!text.trim()) throw new Error("No readable text was found. Scanned PDFs are supported when their pages are clear enough to read.");
      const indexedText = text.slice(0, 500000);
      doc.isTruncated = text.length > indexedText.length;
      doc.fullText = indexedText;
      doc.chunks = chunkText(indexedText);
      doc.status = "ready";
      await doc.save();
    } catch (extractErr) {
      doc.status = "failed";
      await doc.save();
      return res.status(422).json({ success: false, message: `Failed to process document: ${extractErr.message}` });
    }

    await recordUsage(req.user._id, "document_upload", { documentId: doc._id });
    res.status(201).json({
      success: true,
      document: { _id: doc._id, originalName: doc.originalName, status: doc.status, sizeBytes: doc.sizeBytes, isTruncated: doc.isTruncated, createdAt: doc.createdAt },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/documents
exports.listDocuments = async (req, res, next) => {
  try {
    const docs = await Document.find({ user: req.user._id })
      .select("originalName status sizeBytes createdAt mimeType isTruncated")
      .sort({ createdAt: -1 });
    res.json({ success: true, documents: docs });
  } catch (err) {
    next(err);
  }
};

// POST /api/documents/:id/ask  { question }
exports.askDocument = async (req, res, next) => {
  try {
    const { question } = req.body;
    if (typeof question !== "string" || !question.trim() || question.length > 12000) {
      return res.status(400).json({ success: false, message: "Enter a question up to 12,000 characters." });
    }
    const doc = await Document.findOne({ _id: req.params.id, user: req.user._id });
    if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
    if (doc.status !== "ready") {
      return res.status(422).json({ success: false, message: `Document is not ready (status: ${doc.status})` });
    }

    const relevant = retrieveRelevantChunks(doc.chunks, question);
    const answer = await aiService.documentQA(
      {
        question: doc.isTruncated
          ? `${question}\n\nNote: Only the first 500,000 readable characters of this document were indexed. If the provided excerpts do not contain the answer, explain that later sections may not have been indexed.`
          : question,
        contextChunks: relevant.map((c) => c.text),
      },
      req.user.preferredLanguage
    );

    let chat = doc.chat ? await Chat.findOne({ _id: doc.chat, user: req.user._id }) : null;
    if (!chat) {
      chat = await Chat.create({ user: req.user._id, title: doc.originalName.slice(0, 60), mode: "document" });
      doc.chat = chat._id;
      await doc.save();
    }
    const userMessage = await Message.create({ chat: chat._id, user: req.user._id, role: "user", content: question.trim(), language: req.user.preferredLanguage });
    const assistantMessage = await Message.create({ chat: chat._id, user: req.user._id, role: "assistant", content: answer, language: req.user.preferredLanguage });
    chat.updatedAt = new Date();
    await chat.save();

    await recordUsage(req.user._id, "document_qa", { documentId: doc._id });
    res.json({ success: true, answer, chatId: chat._id, userMessage, assistantMessage, usedChunks: relevant.map((c) => c.index) });
  } catch (err) {
    next(err);
  }
};

// POST /api/documents/:id/summarize
exports.summarizeDocument = async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, user: req.user._id });
    if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
    if (doc.status !== "ready") {
      return res.status(422).json({ success: false, message: `Document is not ready (status: ${doc.status})` });
    }
    const topChunks = doc.chunks.slice(0, 8).map((c) => c.text);
    const summary = await aiService.documentQA(
      {
        question: `Summarize this document based on the provided excerpts. ${doc.isTruncated ? "Only its first 500,000 readable characters were indexed, so state that this is a partial summary." : "Cover the main points."}`,
        contextChunks: topChunks,
      },
      req.user.preferredLanguage
    );
    res.json({ success: true, summary });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/documents/:id
exports.deleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
    if (doc.storedPath && fs.existsSync(doc.storedPath)) fs.unlinkSync(doc.storedPath);
    res.json({ success: true, message: "Document deleted" });
  } catch (err) {
    next(err);
  }
};

// POST /api/documents/analyze-image  (multipart, field: file) { question }
exports.analyzeImage = async (req, res, next) => {
  let uploadedPath = req.file?.path;
  let keepUploadedFile = false;
  const createdMessageIds = [];
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Choose a file to upload." });
    const chat = req.body.chatId
      ? await Chat.findOne({ _id: req.body.chatId, user: req.user._id })
      : null;
    if (req.body.chatId && !chat) return res.status(404).json({ success: false, message: "Chat not found" });
    const ext = path.extname(req.file.originalname).toLowerCase();
    const mimeType = getSafeMimeType(req.file);
    const isImage = mimeType.startsWith("image/");
    let answer;
    if (isImage) {
      const base64Image = fs.readFileSync(req.file.path, { encoding: "base64" });
      answer = await aiService.analyzeImage(
        { base64Image, mimeType, question: `${formatUploadRequest(req.body.responseStyle)}\nUser question: ${req.body.question || "Explain this image."}` },
        req.user.preferredLanguage
      );
    } else {
      let text;
      let pdfPageCount = 0;
      if (ext === ".pdf") {
        const pdf = await extractPdf(req.file.path);
        text = pdf.text;
        pdfPageCount = pdf.pageCount;
      } else {
        text = await extractText(req.file.path, mimeType);
      }
      if (ext === ".pdf" && text.trim().length < Math.max(40, pdfPageCount * 80)) {
        text = await aiService.extractPdfText({ base64Data: fs.readFileSync(req.file.path, "base64") }, req.user.preferredLanguage);
      }
      if (!text.trim()) return res.status(422).json({ success: false, message: "No readable text was found in this file." });
      const wasTruncated = text.length > 500000;
      const chunks = chunkText(text.slice(0, 500000));
      const truncationNote = wasTruncated ? "The file contains more than 500,000 readable characters; only the beginning of the file was indexed. Tell the user this limitation in the answer." : "";
      answer = await aiService.documentQA({
        question: `${req.body.question || "Explain this file."}\n\n${formatUploadRequest(req.body.responseStyle)}\n${truncationNote}`,
        contextChunks: retrieveRelevantChunks(chunks, req.body.question || "main ideas key concepts questions", 8).map((chunk) => chunk.text),
      }, req.user.preferredLanguage);
    }
    if (chat) {
      const userMessage = await Message.create({
        chat: chat._id,
        user: req.user._id,
        role: "user",
        content: `File: ${req.file.originalname}\n${req.body.question || "Explain this file in notes."}`,
        attachment: { originalName: req.file.originalname, mimeType, sizeBytes: req.file.size },
        attachmentPath: req.file.path,
      });
      createdMessageIds.push(userMessage._id);
      userMessage.attachmentPath = undefined;
      const assistantMessage = await Message.create({ chat: chat._id, user: req.user._id, role: "assistant", content: answer });
      createdMessageIds.push(assistantMessage._id);
      if (chat.title === "New Chat") chat.title = (req.body.question || `File: ${req.file.originalname}`).slice(0, 60);
      chat.updatedAt = new Date();
      await chat.save();
      await recordUsage(req.user._id, "chat", { chatId: chat._id });
      keepUploadedFile = true;
      res.json({ success: true, answer, userMessage, assistantMessage });
    } else {
      res.json({ success: true, answer });
    }
  } catch (err) {
    if (createdMessageIds.length) {
      await Message.deleteMany({ _id: { $in: createdMessageIds } }).catch((cleanupErr) => {
        console.error("Could not clean up failed file analysis messages:", cleanupErr.message);
      });
    }
    next(err);
  } finally {
    if (!keepUploadedFile && uploadedPath && fs.existsSync(uploadedPath)) fs.unlinkSync(uploadedPath);
  }
};

exports.getChatAttachment = async (req, res, next) => {
  try {
    const message = await Message.findOne({ _id: req.params.messageId, user: req.user._id, role: "user" }).select("+attachmentPath attachment");
    if (!message?.attachmentPath || !message.attachment) return res.status(404).json({ success: false, message: "Attachment not found." });
    const chat = await Chat.exists({ _id: message.chat, user: req.user._id });
    if (!chat) return res.status(404).json({ success: false, message: "Attachment not found." });
    res.type(message.attachment.mimeType);
    const inlinePreview = message.attachment.mimeType.startsWith("image/") || message.attachment.mimeType === "application/pdf";
    res.set("Content-Disposition", `${inlinePreview ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(message.attachment.originalName)}`);
    return res.sendFile(path.resolve(message.attachmentPath));
  } catch (err) {
    next(err);
  }
};

function formatUploadRequest(style) {
  const instructions = {
    notes: "Explain the important ideas as beginner-friendly study notes. Use plain, simple language, short headings, brief definitions, and one easy example where useful. Avoid advanced theory and long formulas unless needed to answer the user's question. Finish with a short recap. Solve included questions step by step.",
    steps: "Explain in beginner-friendly language. Solve the included problem in small numbered steps, explain any difficult term, and clearly mark the final answer. Keep each step short and do not add advanced theory unless it is needed.",
    summary: "Give a short, beginner-friendly summary of only the main ideas. Explain any necessary technical term in simple words and include an example only if it makes the topic clearer.",
    keyterms: "List the important terms and explain each in one or two simple sentences. Add a small example when useful, then give a short recap. Solve included questions briefly and clearly.",
  };
  return instructions[style] || instructions.notes;
}
