
import express from 'express';
import {
  assignOrganizationPlan,
  getOrganizationInvoices,
  getAvailablePlansForOrganization,
  organizationSelfSubscribe,
} from '../controllers/organizationSubscriptionController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/plans', authenticateToken, getAvailablePlansForOrganization);
router.post('/subscribe', authenticateToken, organizationSelfSubscribe);
router.post('/organizations/:organizationId/assign-plan', authenticateToken, assignOrganizationPlan);
router.get('/organizations/:organizationId/invoices', authenticateToken, getOrganizationInvoices);

export default router;
