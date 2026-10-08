const router = require("express").Router();
const { 
  getDashboardStats, 
  listUsers, 
  updateUser, 
  getUserDetails,
  getUserChats,
  getChatDetails,
  getAnalytics
} = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/auth");

// All admin routes are protected by both middlewares
router.use(protect, adminOnly);

router.get("/dashboard", getDashboardStats);
router.get("/users", listUsers);
router.get("/users/:id", getUserDetails);
router.patch("/users/:id", updateUser);
router.get("/users/:id/chats", getUserChats);
router.get("/chats/:id", getChatDetails);
router.get("/analytics", getAnalytics);

module.exports = router;
