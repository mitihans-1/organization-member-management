import { Router } from 'express';
import { getDashboardStats, getAnalytics } from '../controllers/dashboardController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/stats', authenticateToken, getDashboardStats);
router.get('/analytics', authenticateToken, getAnalytics);

export default router;
