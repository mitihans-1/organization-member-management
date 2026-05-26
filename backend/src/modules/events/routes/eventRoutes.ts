import { Router } from 'express';
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
} from '../controllers/eventController';
import { authenticateToken, optionalAuthenticateToken } from '../../../middleware/authMiddleware';
import { uploadImage } from '../../../middleware/upload';

const router = Router();

router.get('/', optionalAuthenticateToken, getEvents);
router.post('/', authenticateToken, uploadImage.single('image'), createEvent);
router.post('/:id/register', authenticateToken, registerForEvent);
router.put('/:id', authenticateToken, uploadImage.single('image'), updateEvent);
router.delete('/:id', authenticateToken, deleteEvent);

export default router;

