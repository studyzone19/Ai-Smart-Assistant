const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { recordUsage } = require("../services/usageService");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  preferredLanguage: user.preferredLanguage,
  memoryEnabled: user.memoryEnabled,
  avatarColor: user.avatarColor,
  createdAt: user.createdAt,
});

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (typeof name !== "string" || !name.trim() || name.trim().length > 80
      || typeof email !== "string" || !email.trim() || email.length > 254
      || typeof password !== "string" || !password || Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({ success: false, message: "Enter a name (up to 80 characters), a valid email, and a password of up to 72 UTF-8 bytes." });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    }
    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }
    const user = await User.create({ 
      name: name.trim(), 
      email: email.trim(), 
      password,
      role: email.trim().toLowerCase() === "luckyrajree123@gmail.com" ? "admin" : "user"
    });
    await recordUsage(user._id, "register");

    const token = signToken(user._id);
    res.status(201).json({ success: true, token, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== "string" || !email.trim() || typeof password !== "string" || !password || Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account deactivated" });
    }
    await recordUsage(user._id, "login");

    const token = signToken(user._id);
    res.json({ success: true, token, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res) => {
  res.json({ success: true, user: sanitizeUser(req.user) });
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, preferredLanguage, memoryEnabled, avatarColor } = req.body;
    const user = req.user;
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim() || name.trim().length > 80) return res.status(400).json({ success: false, message: "Display name must be 1–80 characters." });
      user.name = name.trim();
    }
    if (preferredLanguage !== undefined) {
      if (!["english", "hindi", "hinglish"].includes(preferredLanguage)) return res.status(400).json({ success: false, message: "Choose a supported response language." });
      user.preferredLanguage = preferredLanguage;
    }
    if (memoryEnabled !== undefined) {
      if (typeof memoryEnabled !== "boolean") return res.status(400).json({ success: false, message: "Memory setting must be true or false." });
      user.memoryEnabled = memoryEnabled;
    }
    if (avatarColor !== undefined) {
      if (typeof avatarColor !== "string" || !/^#[0-9a-f]{6}$/i.test(avatarColor)) return res.status(400).json({ success: false, message: "Choose a valid avatar color." });
      user.avatarColor = avatarColor;
    }
    await user.save();
    res.json({ success: true, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
};
