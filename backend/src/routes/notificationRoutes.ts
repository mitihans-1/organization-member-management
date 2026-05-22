import { Router } from 'express';
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  createTestNotification,
} from '../controllers/notificationController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticateToken, listNotifications);
router.patch('/:id/read', authenticateToken, markNotificationRead);
router.post('/read-all', authenticateToken, markAllNotificationsRead);
router.post('/test', authenticateToken, createTestNotification);

export default router;
