const User = require("../models/User");
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const Document = require("../models/Document");
const Usage = require("../models/Usage");

// GET /api/admin/dashboard
exports.getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      userCount,
      chatCount,
      messageCount,
      newUsersToday,
      activeUsers
    ] = await Promise.all([
      User.countDocuments(),
      Chat.countDocuments(),
      Message.countDocuments(),
      User.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ isActive: true })
    ]);

    res.json({
      success: true,
      stats: { userCount, chatCount, messageCount, newUsersToday, activeUsers },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users
// Supports search by name/email, and pagination
exports.listUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Get chat count for each user (optional, can be heavy if many users, but fine for admin page)
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const totalChats = await Chat.countDocuments({ user: user._id });
      return { ...user.toObject(), totalChats };
    }));

    res.json({ 
      success: true, 
      users: usersWithStats, 
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users/:id
exports.getUserDetails = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const totalChats = await Chat.countDocuments({ user: user._id });
    const totalMessages = await Message.countDocuments({ user: user._id });

    res.json({ success: true, user: { ...user.toObject(), totalChats, totalMessages } });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users/:id/chats
exports.getUserChats = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";

    const query = { user: req.params.id };
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    const total = await Chat.countDocuments(query);
    const chats = await Chat.find(query)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const chatsWithMsgCount = await Promise.all(chats.map(async (chat) => {
      const msgCount = await Message.countDocuments({ chat: chat._id });
      return { ...chat.toObject(), msgCount };
    }));

    res.json({ 
      success: true, 
      chats: chatsWithMsgCount,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/chats/:id
exports.getChatDetails = async (req, res, next) => {
  try {
    const chat = await Chat.findById(req.params.id).populate("user", "name email");
    if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });

    const messages = await Message.find({ chat: chat._id }).sort({ createdAt: 1 });

    res.json({ success: true, chat, messages });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/analytics
exports.getAnalytics = async (req, res, next) => {
  try {
    const [userCount, chatCount, messageCount] = await Promise.all([
      User.countDocuments(),
      Chat.countDocuments(),
      Message.countDocuments(),
    ]);

    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Users per day
    const newUsersRecent = await User.aggregate([
      { $match: { createdAt: { $gte: last7Days } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Chats per day
    const chatsRecent = await Chat.aggregate([
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
      analytics: { 
        overview: { userCount, chatCount, messageCount },
        newUsersRecent,
        chatsRecent
      },
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/users/:id  { role, isActive }
exports.updateUser = async (req, res, next) => {
  try {
    const { role, isActive } = req.body;
    if (role !== undefined && !["user", "admin"].includes(role)) return res.status(400).json({ success: false, message: "Role must be user or admin." });
    if (isActive !== undefined && typeof isActive !== "boolean") return res.status(400).json({ success: false, message: "Account status must be true or false." });
    
    // Prevent admin from downgrading themselves accidentally
    if (role === "user" && req.user._id.toString() === req.params.id) {
      return res.status(400).json({ success: false, message: "Cannot downgrade your own admin account." });
    }

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
