import { Router } from 'express';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../controllers/eventController';
import { authenticateToken } from '../middleware/authMiddleware';
import { uploadImage } from '../middleware/upload';

const router = Router();

router.get('/', getEvents);
router.post('/', authenticateToken, uploadImage.single('image'), createEvent);
router.put('/:id', authenticateToken, uploadImage.single('image'), updateEvent);
router.delete('/:id', authenticateToken, deleteEvent);

export default router;
