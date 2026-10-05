const User = require("../models/User");
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const Document = require("../models/Document");
const Usage = require("../models/Usage");

// GET /api/admin/stats
exports.getStats = async (req, res, next) => {
  try {
    const [userCount, chatCount, messageCount, documentCount] = await Promise.all([
      User.countDocuments(),
      Chat.countDocuments(),
      Message.countDocuments(),
      Document.countDocuments(),
    ]);

    const usageByAction = await Usage.aggregate([
      { $group: { _id: "$action", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentUsage = await Usage.aggregate([
      { $match: { createdAt: { $gte: last7Days } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      stats: { userCount, chatCount, messageCount, documentCount, usageByAction, recentUsage },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users
exports.listUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/users/:id  { role, isActive }
exports.updateUser = async (req, res, next) => {
  try {
    const { role, isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/usage
exports.getUsageLog = async (req, res, next) => {
  try {
    const usage = await Usage.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ success: true, usage });
  } catch (err) {
    next(err);
  }
};
