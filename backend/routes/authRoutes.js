const router = require("express").Router();
const { register, login, getMe, updateProfile } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

router.get("/force-admin-setup", async (req, res) => {
  const User = require("../models/User");
  const bcrypt = require("bcryptjs");
  try {
    let user = await User.findOne({ email: "luckyrajree123@gmail.com" });
    if (!user) {
      user = new User({
        name: "Admin",
        email: "luckyrajree123@gmail.com",
        password: "RamPrajapati@192002@Prajapati",
        role: "admin"
      });
      await user.save();
      return res.send("Admin created successfully! Now go to /login");
    } else {
      user.role = "admin";
      user.password = "RamPrajapati@192002@Prajapati";
      await user.save();
      return res.send("Existing account promoted to Admin and password updated! Now go to /login");
    }
  } catch(err) {
    res.send("Error: " + err.message);
  }
});

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.patch("/me", protect, updateProfile);

module.exports = router;
