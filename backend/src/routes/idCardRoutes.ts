import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import {
  requestIdCard,
  getMyIdCard,
  logPrint,
  getRequests,
  approveRequest,
  rejectRequest,
  verifyPayment,
  getGeneratedCards,
  revokeCard,
  regenerateCard,
  verifyPublicQR,
  getVerificationLogs,
  updateCardDetails
} from '../controllers/idCardController';

const router = Router();

// Public Verification
router.get('/verify/:qrToken', verifyPublicQR);

// All other routes require authentication
router.use(authenticateToken);

// Member Routes
router.post('/request', requestIdCard);
router.get('/my-card', getMyIdCard);
router.post('/print-log', logPrint);

// Org Admin Routes
router.get('/requests', getRequests);
router.post('/requests/:id/approve', approveRequest);
router.post('/requests/:id/reject', rejectRequest);
router.post('/requests/:id/verify-payment', verifyPayment);

router.get('/generated', getGeneratedCards);
router.get('/logs', getVerificationLogs);
router.post('/:id/revoke', revokeCard);
router.post('/:id/regenerate', regenerateCard);
router.patch('/:id/details', updateCardDetails);

export default router;
