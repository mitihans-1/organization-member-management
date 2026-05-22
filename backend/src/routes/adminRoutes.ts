import { Router } from 'express';
import { getOrganizations, getAllOrganizations, createOrganization, updateOrganization, deleteOrganization, createOrgAdmin } from '../controllers/adminController';
import { getSystemConfig, updateSystemConfig } from '../controllers/systemConfigController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/organizations', authenticateToken, getOrganizations);
router.get('/organizations/all', authenticateToken, getAllOrganizations);
router.post('/organizations', authenticateToken, createOrganization);
router.put('/organizations/:id', authenticateToken, updateOrganization);
router.delete('/organizations/:id', authenticateToken, deleteOrganization);
router.post('/org-admins', authenticateToken, createOrgAdmin);

router.get('/system-config', authenticateToken, getSystemConfig);
router.put('/system-config', authenticateToken, updateSystemConfig);

export default router;
