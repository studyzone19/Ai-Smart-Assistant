/**
 * pdfService.js
 * Extracts text from uploaded documents (PDF, DOCX, TXT, CSV) and
 * chunks it for retrieval-based Q&A.
 */
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const JSZip = require("jszip");

const decodeXml = (value) => value
  .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'");

async function extractPdf(filePath) {
  const data = await pdfParse(fs.readFileSync(filePath));
  return { text: data.text || "", pageCount: data.numpages || 1 };
}

async function extractOfficeXml(filePath, type) {
  const zip = await JSZip.loadAsync(fs.readFileSync(filePath));
  const entries = Object.keys(zip.files).sort();
  const sortByNumber = (a, b) => Number(a.match(/(\d+)\.xml$/)?.[1] || 0) - Number(b.match(/(\d+)\.xml$/)?.[1] || 0);
  if (type === "xlsx") {
    const shared = zip.file("xl/sharedStrings.xml");
    const sharedStrings = shared
      ? [...(await shared.async("string")).matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map(([, item]) =>
        [...item.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(([, text]) => decodeXml(text)).join(""))
      : [];
    const sheets = entries.filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name)).sort(sortByNumber);
    const output = [];
    for (const name of sheets) {
      const xml = await zip.file(name).async("string");
      const rows = [...xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)].map(([, row]) =>
        [...row.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)].map(([, attrs, cell]) => {
          const value = cell.match(/<v>([\s\S]*?)<\/v>/)?.[1] || [...cell.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(([, t]) => t).join("");
          const sharedIndex = attrs.match(/\bt="s"/) ? Number(value) : -1;
          return decodeXml(sharedIndex >= 0 ? (sharedStrings[sharedIndex] || "") : value);
        }).filter(Boolean).join(" | ")
      ).filter(Boolean);
      output.push(`Sheet ${name.split("/").pop()}:\n${rows.join("\n")}`);
    }
    return output.join("\n\n");
  }
  if (type === "pptx") {
    const slides = entries.filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name)).sort(sortByNumber);
    const output = [];
    for (const name of slides) {
      const xml = await zip.file(name).async("string");
      const text = [...xml.matchAll(/<a:t\b[^>]*>([\s\S]*?)<\/a:t>/g)].map(([, part]) => decodeXml(part)).join(" ");
      output.push(`${name.split("/").pop()}: ${text}`);
    }
    return output.join("\n");
  }
}

async function extractText(filePath, mimeType) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".pdf") {
    const data = await extractPdf(filePath);
    return data.text;
  }

  if (ext === ".docx") {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  if (ext === ".xlsx") return extractOfficeXml(filePath, "xlsx");
  if (ext === ".pptx") return extractOfficeXml(filePath, "pptx");

  if ([".txt", ".csv", ".md", ".json", ".html", ".htm", ".xml", ".log", ".yaml", ".yml", ".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".c", ".cpp", ".h", ".css", ".sql"].includes(ext)) {
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
  const stopwords = new Set([
    "the", "is", "a", "an", "of", "to", "in", "and", "for", "on", "what", "how", "does", "this", "that", "with", "from", "are", "was", "were",
    "क्या", "कैसे", "क्यों", "कब", "कहाँ", "है", "हैं", "था", "थी", "थे", "का", "की", "के", "को", "में", "से", "और", "एक", "यह", "वह", "पर",
  ]);
  const tokenize = (value) => new Set(
    value.normalize("NFKC").toLocaleLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/).filter((word) => [...word].length > 1 && !stopwords.has(word))
  );
  const qWords = tokenize(question);

  const scored = chunks.map((c) => {
    const chunkWords = tokenize(c.text);
    const score = [...qWords].reduce((acc, word) => acc + (chunkWords.has(word) ? 1 : 0), 0);
    return { ...c, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter((c) => c.score > 0).slice(0, topK);

  // Fallback: if nothing scored, just return the first few chunks
  return top.length > 0 ? top : chunks.slice(0, topK);
}

module.exports = { extractText, extractPdf, chunkText, retrieveRelevantChunks };
