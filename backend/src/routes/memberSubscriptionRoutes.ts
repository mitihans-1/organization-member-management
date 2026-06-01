
import express from 'express';
import {
  getMemberSubscriptions,
  getMemberSubscriptionById,
  createMemberSubscription,
  updateMemberSubscription,
  cancelMemberSubscription,
  pauseMemberSubscription,
  resumeMemberSubscription,
  getRecurringPayments,
  getMemberSubscriptionsForMember,
  getAvailablePlansForMember,
  memberSelfSubscribe,
} from '../controllers/memberSubscriptionController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/member-subscriptions/organizations/:orgId', authenticateToken, getMemberSubscriptions);
router.get('/member-subscriptions/member', authenticateToken, getMemberSubscriptionsForMember);
router.get('/member-subscriptions/member/available-plans', authenticateToken, getAvailablePlansForMember);
router.post('/member-subscriptions/member/subscribe', authenticateToken, memberSelfSubscribe);
router.get('/member-subscriptions/:id', authenticateToken, getMemberSubscriptionById);
router.get('/member-subscriptions/:id/recurring-payments', authenticateToken, getRecurringPayments);
router.post('/member-subscriptions/organizations/:orgId/members/:memberId', authenticateToken, createMemberSubscription);
router.put('/member-subscriptions/:id', authenticateToken, updateMemberSubscription);
router.post('/member-subscriptions/:id/cancel', authenticateToken, cancelMemberSubscription);
router.post('/member-subscriptions/:id/pause', authenticateToken, pauseMemberSubscription);
router.post('/member-subscriptions/:id/resume', authenticateToken, resumeMemberSubscription);

export default router;

