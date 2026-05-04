import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import * as chapaController from '../controllers/chapaController';

const router = Router();

// Initialize payments
router.post('/initialize/plan', authenticateToken, chapaController.initializePlanPayment);
router.post('/initialize/event', authenticateToken, chapaController.initializeEventPayment);

// Verify transaction
router.get('/verify/:tx_ref', authenticateToken, chapaController.verifyTransaction);

// Webhook (No auth, Chapa will call this)
router.post('/webhook', chapaController.handleWebhook);

export default router;
