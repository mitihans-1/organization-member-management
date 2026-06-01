import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import {
  getLicensePlans,
  getOrgLicensePlans,
  createLicensePlan,
  updateLicensePlan,
  deleteLicensePlan
} from '../controllers/licensePlanController';

const router = express.Router();

// Public / member endpoints
router.get('/organization/:organizationId', getLicensePlans);

// Org Admin endpoints (protected)
router.use(authenticateToken);
router.get('/', getOrgLicensePlans);
router.post('/', createLicensePlan);
router.put('/:id', updateLicensePlan);
router.delete('/:id', deleteLicensePlan);

export default router;
