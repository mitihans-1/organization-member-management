import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import {
  getConversations,
  getMessages,
  sendMessage,
  createConversation,
  markAsRead,
  getChatableUsers
} from '../controllers/chatController';

const router = express.Router();

router.use(authenticateToken);

router.get('/users', getChatableUsers);
router.get('/conversations', getConversations);
router.post('/conversations', createConversation);
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/conversations/:conversationId/messages', sendMessage);
router.put('/conversations/:conversationId/read', markAsRead);

export default router;
