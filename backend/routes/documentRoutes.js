const router = require("express").Router();
const {
  uploadDocument, listDocuments, askDocument, summarizeDocument, deleteDocument, analyzeImage,
} = require("../controllers/documentController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.use(protect);
router.get("/", listDocuments);
router.post("/upload", upload.single("file"), uploadDocument);
router.post("/analyze-image", upload.single("file"), analyzeImage);
router.post("/:id/ask", askDocument);
router.post("/:id/summarize", summarizeDocument);
router.delete("/:id", deleteDocument);

module.exports = router;
