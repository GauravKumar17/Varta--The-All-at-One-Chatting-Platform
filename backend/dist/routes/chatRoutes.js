import express from "express";
import { sendMessage, getMessages, markAsRead, deleteMessages } from "../controllers/chatController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { multerMiddleware } from "../config/cloudinary.js";
const router = express.Router();
router.post('/sendMessage', authMiddleware, multerMiddleware, sendMessage);
router.get('/conversations', authMiddleware, getMessages);
router.get('/conversations/:conversationId/messages', authMiddleware, getMessages);
router.put('/messages/read', authMiddleware, markAsRead);
router.delete('/messages/:mesaageIds', authMiddleware, deleteMessages);
export default router;
//# sourceMappingURL=chatRoutes.js.map