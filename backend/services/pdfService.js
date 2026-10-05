/**
 * pdfService.js
 * Extracts text from uploaded documents (PDF, DOCX, TXT, CSV) and
 * chunks it for retrieval-based Q&A.
 */
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

async function extractText(filePath, mimeType) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".pdf") {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (ext === ".docx") {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  if (ext === ".txt" || ext === ".csv") {
    return fs.readFileSync(filePath, "utf-8");
  }

  throw new Error(`Unsupported document type for text extraction: ${ext}`);
}

/**
 * Splits text into overlapping chunks for better retrieval context.
 */
function chunkText(text, chunkSize = 1200, overlap = 150) {
  const clean = text.replace(/\s+/g, " ").trim();
  const chunks = [];
  let start = 0;
  let index = 0;

  while (start < clean.length) {
    const end = Math.min(start + chunkSize, clean.length);
    chunks.push({ index: index++, text: clean.slice(start, end) });
    start += chunkSize - overlap;
  }

  return chunks;
}

/**
 * Naive keyword-overlap retrieval (no external vector DB needed).
 * Scores each chunk by shared significant words with the question.
 */
function retrieveRelevantChunks(chunks, question, topK = 4) {
  const stopwords = new Set(["the", "is", "a", "an", "of", "to", "in", "and", "for", "on", "what", "how", "does", "this", "that"]);
  const qWords = question
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopwords.has(w));

  const scored = chunks.map((c) => {
    const lower = c.text.toLowerCase();
    const score = qWords.reduce((acc, w) => acc + (lower.includes(w) ? 1 : 0), 0);
    return { ...c, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter((c) => c.score > 0).slice(0, topK);

  // Fallback: if nothing scored, just return the first few chunks
  return top.length > 0 ? top : chunks.slice(0, topK);
}

module.exports = { extractText, chunkText, retrieveRelevantChunks };
