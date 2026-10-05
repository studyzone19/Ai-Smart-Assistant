const router = require("express").Router();
const { generateReport, listReports, deleteReport } = require("../controllers/reportController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.post("/generate", generateReport);
router.get("/", listReports);
router.delete("/:id", deleteReport);

module.exports = router;
