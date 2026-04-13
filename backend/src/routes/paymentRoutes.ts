import { Router } from 'express';
import { getPayments, createPayment, getPaymentById } from '../controllers/paymentController';
import { initializeChapaPayment, verifyChapaPayment } from '../controllers/chapaController';
import { initializeTelebirrPayment, handleTelebirrNotification } from '../controllers/telebirrController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/verify/:tx_ref', verifyChapaPayment);

router.get('/', authenticateToken, getPayments);
router.post('/', authenticateToken, createPayment);
router.post('/initialize', authenticateToken, initializeChapaPayment);

// Telebirr Routes
router.post('/telebirr/initialize', authenticateToken, initializeTelebirrPayment);
router.post('/telebirr/notify', handleTelebirrNotification); // No auth for webhook

router.get('/:id', authenticateToken, getPaymentById);

export default router;
