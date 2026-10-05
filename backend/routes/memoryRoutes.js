const router = require("express").Router();
const {
  listMemories, addMemory, updateMemory, deleteMemory, clearAllMemories, toggleMemory,
} = require("../controllers/memoryController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.get("/", listMemories);
router.post("/", addMemory);
router.patch("/toggle", toggleMemory);
router.patch("/:id", updateMemory);
router.delete("/:id", deleteMemory);
router.delete("/", clearAllMemories);

module.exports = router;
