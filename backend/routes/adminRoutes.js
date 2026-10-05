const router = require("express").Router();
const { getStats, listUsers, updateUser, getUsageLog } = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/auth");

router.use(protect, adminOnly);
router.get("/stats", getStats);
router.get("/users", listUsers);
router.patch("/users/:id", updateUser);
router.get("/usage", getUsageLog);

module.exports = router;
