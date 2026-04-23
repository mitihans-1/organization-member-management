import express from 'express';
import { uploadPaymentReceipt, confirmPayment, getPayments, createPayment, getPaymentById, rejectPayment, revokePayment, createOrgPlanPayment, createEventPayment, getOrgPayments, confirmOrgPayment, rejectOrgPayment, confirmEventPayment, rejectEventPayment } from '../controllers/paymentController';
import { uploadReceipt } from '../middleware/upload';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', authenticateToken, getPayments);
router.post('/', authenticateToken, createPayment);
router.get('/:id', authenticateToken, getPaymentById);

router.put('/:id/confirm', authenticateToken, confirmPayment);
router.put('/:id/reject', authenticateToken, rejectPayment);
router.put('/:id/revoke', authenticateToken, revokePayment);

router.post(
    '/upload-receipt',
    authenticateToken,
    uploadReceipt.single('receipt'),
    uploadPaymentReceipt
);

router.post('/org-plan', authenticateToken, createOrgPlanPayment);
router.post('/event', authenticateToken, createEventPayment);
router.get('/org/all', authenticateToken, getOrgPayments);
router.put('/org/:id/confirm', authenticateToken, confirmOrgPayment);
router.put('/org/:id/reject', authenticateToken, rejectOrgPayment);
router.put('/event/:id/confirm', authenticateToken, confirmEventPayment);
router.put('/event/:id/reject', authenticateToken, rejectEventPayment);

export default router;
