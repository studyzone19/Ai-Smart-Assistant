const router = require("express").Router();
const { listResumes, saveResume, generateSection, deleteResume } = require("../controllers/resumeController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.get("/", listResumes);
router.post("/", saveResume);
router.post("/:id/generate", generateSection);
router.delete("/:id", deleteResume);

module.exports = router;
