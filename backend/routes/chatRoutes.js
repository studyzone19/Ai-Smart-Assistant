const router = require("express").Router();
const {
  listChats, createChat, getMessages, deleteChat, updateChat,
  sendMessage, regenerateMessage, deleteMessage, editMessage,
} = require("../controllers/chatController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.get("/", listChats);
router.post("/", createChat);
router.get("/:id/messages", getMessages);
router.post("/:id/messages", sendMessage);
router.post("/:id/regenerate", regenerateMessage);
router.post("/:id/edit-message", editMessage);
router.delete("/:id/messages/:messageId", deleteMessage);
router.patch("/:id", updateChat);
router.delete("/:id", deleteChat);

module.exports = router;
