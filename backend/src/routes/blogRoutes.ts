import { Router } from 'express';
import { getBlogs, createBlog, updateBlog, deleteBlog, getBlogById } from '../controllers/blogController';
import { getComments, postComment } from '../controllers/commentController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getBlogs);
router.get('/:id', getBlogById);
router.get('/:id/comments', getComments);
router.post('/:id/comments', postComment);
router.post('/', authenticateToken, createBlog);
router.put('/:id', authenticateToken, updateBlog);
router.delete('/:id', authenticateToken, deleteBlog);

export default router;
