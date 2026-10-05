require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const { errorHandler, notFound } = require("./middleware/errorHandler");

connectDB();

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Global rate limit: generous for normal use, blocks abuse/scraping
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
});
// app.use("/api", limiter);

// Stricter limiter for AI-heavy routes
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many AI requests, slow down a little." },
});
// app.use(["/api/chats", "/api/study", "/api/code", "/api/search", "/api/documents"], aiLimiter);

app.get("/api/health", (req, res) => res.json({ success: true, message: "AI Smart Assistant API is running" }));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/chats", require("./routes/chatRoutes"));
app.use("/api/memory", require("./routes/memoryRoutes"));
app.use("/api/documents", require("./routes/documentRoutes"));
app.use("/api/study", require("./routes/studyRoutes"));
app.use("/api/code", require("./routes/codeRoutes"));
app.use("/api/search", require("./routes/searchRoutes"));
app.use("/api/resume", require("./routes/resumeRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`AI Smart Assistant backend running on port ${PORT}`));
