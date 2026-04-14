import { Router } from 'express';
import {
  getAttributeDefinitions,
  createAttributeDefinition,
  updateAttributeDefinition,
  deleteAttributeDefinition,
  getMemberAttributeValues,
  updateMemberAttributeValues
} from '../controllers/customAttributeController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/definitions', getAttributeDefinitions);
router.post('/definitions', createAttributeDefinition);
router.put('/definitions/:id', updateAttributeDefinition);
router.delete('/definitions/:id', deleteAttributeDefinition);

router.get('/values/:memberId', getMemberAttributeValues);
router.post('/values/:memberId', updateMemberAttributeValues);

export default router;
