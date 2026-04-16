import express from 'express';
import { uploadPaymentReceipt, confirmPayment, getPayments, createPayment, getPaymentById, rejectPayment, revokePayment } from '../controllers/paymentController';
import { uploadReceipt } from '../middleware/upload';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', authenticateToken, getPayments);
router.post('/', authenticateToken, createPayment);
router.get('/:id', authenticateToken, getPaymentById);

// Admin manual confirmation & rejection & revocation
router.put('/:id/confirm', authenticateToken, confirmPayment);
router.put('/:id/reject', authenticateToken, rejectPayment);
router.put('/:id/revoke', authenticateToken, revokePayment);

// Route: User uploads their screenshot
router.post(
    '/upload-receipt',
    authenticateToken,
    uploadReceipt.single('receipt'),
    uploadPaymentReceipt
);

export default router;
