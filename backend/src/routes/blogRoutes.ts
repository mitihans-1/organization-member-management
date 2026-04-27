import { Router } from 'express';
import { getBlogs, createBlog, updateBlog, deleteBlog } from '../controllers/blogController';
import { authenticateToken } from '../middleware/authMiddleware';
import { uploadImage } from '../middleware/upload';

const router = Router();

router.get('/', getBlogs);
router.post('/', authenticateToken, uploadImage.single('image'), createBlog);
router.put('/:id', authenticateToken, uploadImage.single('image'), updateBlog);
router.delete('/:id', authenticateToken, deleteBlog);

export default router;
