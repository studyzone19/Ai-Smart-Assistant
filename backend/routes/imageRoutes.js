const router = require("express").Router();
const { protect } = require("../middleware/auth");
const { generateImage } = require("../controllers/imageController");

router.post("/generate", protect, generateImage);

module.exports = router;
