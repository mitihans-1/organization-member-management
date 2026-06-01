
import express from 'express';
import {
  getSubscriptionPlans,
  getSubscriptionPlanById,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
} from '../controllers/memberSubscriptionPlanController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/member-subscription-plans/organizations/:orgId', getSubscriptionPlans);
router.get('/member-subscription-plans/:id', getSubscriptionPlanById);
router.post('/member-subscription-plans/organizations/:orgId', authenticateToken, createSubscriptionPlan);
router.put('/member-subscription-plans/:id', authenticateToken, updateSubscriptionPlan);
router.delete('/member-subscription-plans/:id', authenticateToken, deleteSubscriptionPlan);

export default router;

