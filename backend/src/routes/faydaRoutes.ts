import { Router } from 'express';
import { verifyFayda, faydaLogin } from '../controllers/faydaController';

const router = Router();

router.post('/verify', verifyFayda);
router.post('/login', faydaLogin);

export default router;
