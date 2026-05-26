
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

const router = express.Router();

router.get('/organizations/:orgId/subscriptions', getMemberSubscriptions);
router.get('/member', getMemberSubscriptionsForMember);
router.get('/member/available-plans', getAvailablePlansForMember);
router.post('/member/subscribe', memberSelfSubscribe);
router.get('/subscriptions/:id', getMemberSubscriptionById);
router.get('/subscriptions/:id/recurring-payments', getRecurringPayments);
router.post('/organizations/:orgId/members/:memberId/subscriptions', createMemberSubscription);
router.put('/subscriptions/:id', updateMemberSubscription);
router.post('/subscriptions/:id/cancel', cancelMemberSubscription);
router.post('/subscriptions/:id/pause', pauseMemberSubscription);
router.post('/subscriptions/:id/resume', resumeMemberSubscription);

export default router;

