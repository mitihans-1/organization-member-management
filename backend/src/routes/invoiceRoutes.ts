
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

const router = express.Router();

router.get('/organizations/:orgId/invoices', getInvoices);
router.get('/member', getInvoicesForMember);
router.get('/invoices/:id', getInvoiceById);
router.post('/organizations/:orgId/invoices', createInvoiceHandler);
router.post('/invoices/:id/send', sendInvoiceHandler);
router.get('/invoices/:id/pdf', downloadInvoicePDF);
router.post('/invoices/:id/mark-paid', markInvoicePaidHandler);
router.post('/invoices/:id/void', voidInvoiceHandler);
router.post('/organizations/:orgId/invoices/organization-plan', createOrganizationPlanInvoice);

export default router;

