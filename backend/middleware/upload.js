const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const allowedDocTypes = [".pdf", ".docx", ".xlsx", ".pptx", ".txt", ".csv", ".md", ".json", ".html", ".htm", ".xml", ".log", ".yaml", ".yml", ".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".c", ".cpp", ".h", ".css", ".sql"];
const allowedImageTypes = [".png", ".jpg", ".jpeg", ".webp"];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if ([...allowedDocTypes, ...allowedImageTypes].includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${ext}`), false);
  }
};

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: 1, fields: 10, fieldSize: 64 * 1024, parts: 11 },
});

upload.MAX_FILE_SIZE = MAX_FILE_SIZE;
module.exports = upload;
