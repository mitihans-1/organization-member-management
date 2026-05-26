
import express from 'express';
import {
  getSubscriptionPlans,
  getSubscriptionPlanById,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
} from '../controllers/memberSubscriptionPlanController';

const router = express.Router();

router.get('/organizations/:orgId/subscription-plans', getSubscriptionPlans);
router.get('/subscription-plans/:id', getSubscriptionPlanById);
router.post('/organizations/:orgId/subscription-plans', createSubscriptionPlan);
router.put('/subscription-plans/:id', updateSubscriptionPlan);
router.delete('/subscription-plans/:id', deleteSubscriptionPlan);

export default router;

