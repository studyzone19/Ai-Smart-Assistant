const router = require("express").Router();
const { codeAssist } = require("../controllers/codeController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.post("/assist", codeAssist);

module.exports = router;
