const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Usage = require("../models/Usage");

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
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required" });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }
    const user = await User.create({ name, email, password });
    await Usage.create({ user: user._id, action: "register" });

    const token = signToken(user._id);
    res.status(201).json({ success: true, token, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account deactivated" });
    }
    await Usage.create({ user: user._id, action: "login" });

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
    if (name !== undefined) user.name = name;
    if (preferredLanguage !== undefined) user.preferredLanguage = preferredLanguage;
    if (memoryEnabled !== undefined) user.memoryEnabled = memoryEnabled;
    if (avatarColor !== undefined) user.avatarColor = avatarColor;
    await user.save();
    res.json({ success: true, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
};
