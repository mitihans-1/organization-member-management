import { Router } from 'express';
import { getPublicStats } from '../controllers/systemConfigController';
import {
  getPlatformContent,
  getOrganizationContent,
  updateOrganizationContent,
} from '../controllers/publicContentController';
import { listApprovedEndorsements } from '../controllers/endorsementController';
import {
  authenticateToken,
  optionalAuthenticateToken,
} from '../middleware/authMiddleware';
import {
  submitContactMessage,
} from '../controllers/contactMessageController';

const router = Router();

router.get('/stats', getPublicStats);
router.get('/platform-content', getPlatformContent);
router.post('/contact', optionalAuthenticateToken, submitContactMessage);
router.get('/endorsements', listApprovedEndorsements);

router.get('/organization-content', authenticateToken, getOrganizationContent);
router.put('/organization-content', authenticateToken, updateOrganizationContent);
router.post('/organization-contact', authenticateToken, submitContactMessage);

export default router;
