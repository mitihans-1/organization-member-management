import { Router } from 'express';
import { listPublicOrganizations, getMyOrganization, updateMyOrganization, getAllOrganizations, assignPlanToOrganization } from '../controllers/organizationController';
import {
  getOrganizationContactMessages,
  markContactMessageRead,
} from '../controllers/contactMessageController';
import { submitEndorsement } from '../controllers/endorsementController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/', listPublicOrganizations);
router.get('/all', authenticateToken, getAllOrganizations);
router.post('/assign-plan', authenticateToken, assignPlanToOrganization);
router.get('/me', authenticateToken, getMyOrganization);
router.put('/me', authenticateToken, updateMyOrganization);
router.get('/me/contact-messages', authenticateToken, getOrganizationContactMessages);
router.patch('/me/contact-messages/:id/read', authenticateToken, markContactMessageRead);
router.post('/me/endorsements', authenticateToken, submitEndorsement);

export default router;
