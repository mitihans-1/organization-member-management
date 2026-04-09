import { Router } from 'express';
import { getPayments, createPayment, getPaymentById } from '../controllers/paymentController';
import { initializeChapaPayment, verifyChapaPayment } from '../controllers/chapaController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticateToken, getPayments);
router.post('/', authenticateToken, createPayment);
router.post('/initialize', authenticateToken, initializeChapaPayment);
router.get('/verify/:tx_ref', authenticateToken, verifyChapaPayment);
router.get('/:id', authenticateToken, getPaymentById);

export default router;
