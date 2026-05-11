import { Router } from 'express';
import { register, login, getProfile, updateProfile, forgotPassword, resetPassword, googleLogin, googleRegister, verifyOtp, resendOtp } from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';
import { uploadImage } from '../middleware/upload';

const router = Router();

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/login', login);
router.post('/google-login', googleLogin);
router.post('/google-register', googleRegister);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, uploadImage.single('profile_photo'), updateProfile);

export default router;
