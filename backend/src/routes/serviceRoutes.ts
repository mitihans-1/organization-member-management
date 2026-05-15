import express from 'express';
import multer from 'multer';
import { getServices, createService, updateService, deleteService, subscribeToService } from '../controllers/serviceController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.get('/', authenticateToken, getServices);
router.post('/', authenticateToken, upload.single('image'), createService);
router.put('/:id', authenticateToken, upload.single('image'), updateService);
router.delete('/:id', authenticateToken, deleteService);
router.post('/:id/subscribe', authenticateToken, subscribeToService);

export default router;
