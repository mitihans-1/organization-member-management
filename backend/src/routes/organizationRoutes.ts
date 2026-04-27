import { Router } from 'express';
import { listPublicOrganizations, getMyOrganization, updateMyOrganization } from '../controllers/organizationController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/', listPublicOrganizations);
router.get('/me', authenticateToken, getMyOrganization);
router.put('/me', authenticateToken, updateMyOrganization);

export default router;
