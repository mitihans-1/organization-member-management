
import express from 'express';
import {
  getInvoices,
  getInvoiceById,
  createInvoiceHandler,
  sendInvoiceHandler,
  downloadInvoicePDF,
  markInvoicePaidHandler,
  voidInvoiceHandler,
  createOrganizationPlanInvoice,
  getInvoicesForMember,
} from '../controllers/invoiceController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/organizations/:orgId/invoices', authenticateToken, getInvoices);
router.get('/member', authenticateToken, getInvoicesForMember);
router.get('/invoices/:id', authenticateToken, getInvoiceById);
router.post('/organizations/:orgId/invoices', authenticateToken, createInvoiceHandler);
router.post('/invoices/:id/send', authenticateToken, sendInvoiceHandler);
router.get('/invoices/:id/pdf', authenticateToken, downloadInvoicePDF);
router.post('/invoices/:id/mark-paid', authenticateToken, markInvoicePaidHandler);
router.post('/invoices/:id/void', authenticateToken, voidInvoiceHandler);
router.post('/organizations/:orgId/invoices/organization-plan', authenticateToken, createOrganizationPlanInvoice);

export default router;

