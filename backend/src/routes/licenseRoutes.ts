import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import {
  requestLicense,
  getMyLicense,
  logPrint,
  getRequests,
  approveRequest,
  rejectRequest,
  verifyPayment,
  getGeneratedLicenses,
  revokeLicense,
  regenerateLicense,
  verifyPublicQR,
  getVerificationLogs,
  updateLicenseDetails
} from '../controllers/licenseController';

const router = Router();

// Public Verification
router.get('/verify/:qrToken', verifyPublicQR);

// All other routes require authentication
router.use(authenticateToken);

// Member Routes
router.post('/request', requestLicense);
router.get('/my-license', getMyLicense);
router.post('/print-log', logPrint);

// Org Admin Routes
router.get('/requests', getRequests);
router.post('/requests/:id/approve', approveRequest);
router.post('/requests/:id/reject', rejectRequest);
router.post('/requests/:id/verify-payment', verifyPayment);

router.get('/generated', getGeneratedLicenses);
router.get('/logs', getVerificationLogs);
router.post('/:id/revoke', revokeLicense);
router.post('/:id/regenerate', regenerateLicense);
router.patch('/:id/details', updateLicenseDetails);

export default router;
