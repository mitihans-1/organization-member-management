import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { uploadReportAttachment } from '../middleware/upload';
import {
  getMemberReports,
  getOrgReports,
  getSuperAdminReports,
  createReport,
  updateReport,
  updateReportStatus,
  updateReportPriority,
  deleteReport,
  acceptReport,
  replyToReport
} from '../controllers/reportController';
import {
  getSuperAdminAnalytics,
  getOrgAnalytics,
  getMemberAnalytics
} from '../controllers/analyticsReportController';

const router = express.Router();

router.get('/analytics/superadmin', authenticateToken, getSuperAdminAnalytics);
router.get('/analytics/org', authenticateToken, getOrgAnalytics);
router.get('/analytics/member', authenticateToken, getMemberAnalytics);

router.get('/member', authenticateToken, getMemberReports);
router.get('/org', authenticateToken, getOrgReports);
router.get('/superadmin', authenticateToken, getSuperAdminReports);
router.post('/', authenticateToken, uploadReportAttachment.single('attachment'), createReport);
router.put('/:id', authenticateToken, updateReport);
router.put('/:id/status', authenticateToken, updateReportStatus);
router.put('/:id/priority', authenticateToken, updateReportPriority);
router.put('/:id/accept', authenticateToken, acceptReport);
router.put('/:id/reply', authenticateToken, replyToReport);
router.delete('/:id', authenticateToken, deleteReport);

export default router;

