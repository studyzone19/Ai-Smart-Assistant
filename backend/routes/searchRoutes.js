const router = require("express").Router();
const { search } = require("../controllers/searchController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.post("/", search);

module.exports = router;
