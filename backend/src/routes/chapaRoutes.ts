import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { uploadReceipt } from '../middleware/upload';
import * as chapaController from '../controllers/chapaController';

const router = Router();

// Initialize payments
router.post('/initialize/plan', authenticateToken, chapaController.initializePlanPayment);
router.post('/initialize/event', authenticateToken, chapaController.initializeEventPayment);
router.post('/initialize/service', authenticateToken, chapaController.initializeServicePayment);
router.post('/initialize/member-subscription', authenticateToken, chapaController.initializeMemberSubscriptionPayment);

// Manual receipt upload for member subscriptions
router.post('/upload/member-subscription', authenticateToken, uploadReceipt.single('receipt'), chapaController.uploadMemberSubscriptionReceipt);

// Org admin confirm/reject member subscription payments
router.patch('/confirm/member-subscription/:id', authenticateToken, chapaController.confirmMemberSubscriptionPayment);
router.patch('/reject/member-subscription/:id', authenticateToken, chapaController.rejectMemberSubscriptionPayment);

// Verify transaction
router.get('/verify/:tx_ref', authenticateToken, chapaController.verifyTransaction);

// Webhook (No auth, Chapa will call this)
router.post('/webhook', chapaController.handleWebhook);

export default router;
