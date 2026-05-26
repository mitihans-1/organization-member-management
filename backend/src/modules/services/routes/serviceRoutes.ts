import express from 'express';
import multer from 'multer';
import {
  getServices,
  createService,
  updateService,
  deleteService,
  subscribeToService,
} from '../controllers/serviceController';
import {
  authenticateToken,
  optionalAuthenticateToken,
} from '../../../middleware/authMiddleware';
import { uploadImage } from '../../../middleware/upload';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.get('/', optionalAuthenticateToken, getServices);
router.post('/', authenticateToken, uploadImage.single('image'), createService);
router.put('/:id', authenticateToken, uploadImage.single('image'), updateService);
router.delete('/:id', authenticateToken, deleteService);
router.post('/:id/subscribe', authenticateToken, subscribeToService);

export default router;
