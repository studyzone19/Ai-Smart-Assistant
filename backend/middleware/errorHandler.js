const errorHandler = (err, req, res, next) => {
  if (err.name !== "MulterError") console.error(err.stack);
  const isMulter = err.name === "MulterError";
  const isUnsupportedFile = err.message?.startsWith("Unsupported file type:");
  const isValidation = err.name === "ValidationError" || err.name === "CastError";
  const isDuplicate = err.code === 11000;
  const statusCode = err.code === "LIMIT_FILE_SIZE" ? 413
    : isMulter || isUnsupportedFile || isValidation || isDuplicate ? (isDuplicate ? 409 : 400)
      : err.statusCode || err.status || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  const message = err.code === "LIMIT_FILE_SIZE"
    ? "The file is larger than the 15 MB upload limit. Choose a smaller file."
    : isUnsupportedFile
      ? `${err.message} Supported extensions: .png, .jpg, .jpeg, .webp, .pdf, .docx, .xlsx, .pptx, .txt, .csv, .md, .json, .html, .htm, .xml, .log, .yaml, .yml, .js, .jsx, .ts, .tsx, .py, .java, .c, .cpp, .h, .css, .sql.`
      : isDuplicate
        ? "A record with this value already exists."
        : err.name === "CastError"
          ? "The supplied record ID is invalid."
      : err.message || "Internal Server Error";
  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};

const notFound = (req, res, next) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
};

module.exports = { errorHandler, notFound };
