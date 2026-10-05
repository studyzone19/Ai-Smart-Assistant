const path = require("path");
const fs = require("fs");
const Document = require("../models/Document");
const Usage = require("../models/Usage");
const { extractText, chunkText, retrieveRelevantChunks } = require("../services/pdfService");
const aiService = require("../services/aiService");

// POST /api/documents/upload  (multipart, field: file)
exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    const doc = await Document.create({
      user: req.user._id,
      originalName: req.file.originalname,
      storedPath: req.file.path,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      status: "processing",
    });

    try {
      const text = await extractText(req.file.path, req.file.mimetype);
      const chunks = chunkText(text);
      doc.fullText = text.slice(0, 500000); // safety cap
      doc.chunks = chunks;
      doc.status = "ready";
      await doc.save();
    } catch (extractErr) {
      doc.status = "failed";
      await doc.save();
      return res.status(422).json({ success: false, message: `Failed to process document: ${extractErr.message}` });
    }

    await Usage.create({ user: req.user._id, action: "document_upload", meta: { documentId: doc._id } });
    res.status(201).json({
      success: true,
      document: { id: doc._id, originalName: doc.originalName, status: doc.status, sizeBytes: doc.sizeBytes, createdAt: doc.createdAt },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/documents
exports.listDocuments = async (req, res, next) => {
  try {
    const docs = await Document.find({ user: req.user._id })
      .select("originalName status sizeBytes createdAt mimeType")
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
    if (!question || !question.trim()) {
      return res.status(400).json({ success: false, message: "Question is required" });
    }
    const doc = await Document.findOne({ _id: req.params.id, user: req.user._id });
    if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
    if (doc.status !== "ready") {
      return res.status(422).json({ success: false, message: `Document is not ready (status: ${doc.status})` });
    }

    const relevant = retrieveRelevantChunks(doc.chunks, question);
    const answer = await aiService.documentQA(
      { question, contextChunks: relevant.map((c) => c.text) },
      req.user.preferredLanguage
    );

    await Usage.create({ user: req.user._id, action: "document_qa", meta: { documentId: doc._id } });
    res.json({ success: true, answer, usedChunks: relevant.map((c) => c.index) });
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
      { question: "Summarize this document comprehensively, covering all major points.", contextChunks: topChunks },
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
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No image uploaded" });
    const base64Image = fs.readFileSync(req.file.path, { encoding: "base64" });
    const answer = await aiService.analyzeImage(
      { base64Image, mimeType: req.file.mimetype, question: req.body.question },
      req.user.preferredLanguage
    );
    fs.unlinkSync(req.file.path); // images aren't persisted, only analyzed
    res.json({ success: true, answer });
  } catch (err) {
    next(err);
  }
};
