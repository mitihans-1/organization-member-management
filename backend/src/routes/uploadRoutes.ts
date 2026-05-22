import { Router } from 'express';
import { uploadAttachment as uploadAttachmentController } from '../controllers/uploadController';
import { uploadAttachment } from '../middleware/upload';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.post('/attachment', uploadAttachment.single('file'), uploadAttachmentController);

export default router;
