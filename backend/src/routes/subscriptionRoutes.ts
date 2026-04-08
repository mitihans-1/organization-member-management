import { Router } from 'express';
import { subscribeToNewsletter } from '../controllers/subscriptionController';

const router = Router();

router.post('/subscribe', subscribeToNewsletter);

export default router;
