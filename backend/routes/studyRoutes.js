const router = require("express").Router();
const { generateStudyContent } = require("../controllers/studyController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.post("/generate", generateStudyContent);

module.exports = router;
