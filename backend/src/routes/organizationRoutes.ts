import { Router } from 'express';
import { uploadAttachment } from '../middleware/upload';
import {
  listPublicOrganizations,
  getMyOrganization,
  updateMyOrganization,
  getAllOrganizations,
  assignPlanToOrganization,
  getOrganizationResources,
  getOrganizationResource,
  uploadOrganizationResource,
  updateOrganizationResource,
  deleteOrganizationResource,
} from '../controllers/organizationController';
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
router.get('/me/resources', authenticateToken, getOrganizationResources);
router.get('/me/resources/:id', authenticateToken, getOrganizationResource);
router.post('/me/resources', authenticateToken, uploadAttachment.single('file'), uploadOrganizationResource);
router.put('/me/resources/:id', authenticateToken, uploadAttachment.single('file'), updateOrganizationResource);
router.delete('/me/resources/:id', authenticateToken, deleteOrganizationResource);
router.get('/me/contact-messages', authenticateToken, getOrganizationContactMessages);
router.patch('/me/contact-messages/:id/read', authenticateToken, markContactMessageRead);
router.post('/me/endorsements', authenticateToken, submitEndorsement);

export default router;
