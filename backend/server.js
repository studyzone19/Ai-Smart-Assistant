require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const app = express();
app.disable("x-powered-by");
const proxyHops = Number(process.env.TRUST_PROXY_HOPS || 0);
if (Number.isInteger(proxyHops) && proxyHops > 0) app.set("trust proxy", proxyHops);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Global request limit protects API and database routes from basic abuse.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
});

// AI endpoints consume provider quota, so keep a separate per-IP limit.
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many AI requests, slow down a little." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many sign-in attempts. Please wait 15 minutes and try again." },
});

app.use("/api", limiter);
app.use(["/api/chats", "/api/study", "/api/code", "/api/search", "/api/documents", "/api/images", "/api/reports", "/api/resume"], aiLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.get("/api/health", (req, res) => res.json({ success: true, message: "AI Smart Assistant API is running" }));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/chats", require("./routes/chatRoutes"));
app.use("/api/memory", require("./routes/memoryRoutes"));
app.use("/api/documents", require("./routes/documentRoutes"));
app.use("/api/images", require("./routes/imageRoutes"));
app.use("/api/study", require("./routes/studyRoutes"));
app.use("/api/code", require("./routes/codeRoutes"));
app.use("/api/search", require("./routes/searchRoutes"));
app.use("/api/resume", require("./routes/resumeRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || /^(replace_with|your_)/i.test(process.env.JWT_SECRET)) {
  console.error("JWT_SECRET is missing, too short, or still uses the example value. Set a random secret of at least 32 characters in backend/.env.");
  process.exitCode = 1;
} else connectDB().then(() => {
  app.listen(PORT, "0.0.0.0", () => console.log(`AI Smart Assistant backend running on port ${PORT}`));
}).catch((err) => {
  console.error(`Backend startup failed: ${err.message}`);
  process.exitCode = 1;
});
