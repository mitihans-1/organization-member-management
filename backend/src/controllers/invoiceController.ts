
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  createInvoice,
  sendInvoice,
  markInvoiceAsPaid,
  voidInvoice,
  getInvoicesByOrganization,
  getInvoicesByMember,
  generateInvoicePDF,
} from '../services/invoiceService';

const prisma = new PrismaClient();

export const getInvoices = async (req: any, res: Response) => {
  try {
    const { orgId } = req.params;
    
    if (req.user.role === 'member') {
      const invoices = await getInvoicesByMember(req.user.userId, orgId);
      return res.status(200).json(invoices);
    }
    
    const invoices = await getInvoicesByOrganization(orgId, req.query);
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invoices', error });
  }
};

export const getInvoicesForMember = async (req: any, res: Response) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { memberId: req.user.userId },
      include: {
        items: true,
        organization: true,
        member: true,
        subscription: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching member invoices', error });
  }
};

export const getInvoiceById = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        organization: true,
        member: true,
        subscription: true,
        payments: true,
      },
    });
    
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    
    if (req.user.role === 'member' && invoice.memberId !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    if (req.user.role === 'orgAdmin') {
      const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
      if (user?.organizationId !== invoice.organizationId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    }
    
    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invoice', error });
  }
};

export const createInvoiceHandler = async (req: any, res: Response) => {
  try {
    const { orgId } = req.params;
    const invoiceData = req.body;
    
    if (req.user.role !== 'orgAdmin') {
      return res.status(403).json({ message: 'Only organization admins can create invoices' });
    }
    
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (user?.organizationId !== orgId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const invoice = await createInvoice({
      ...invoiceData,
      organizationId: orgId,
    });
    
    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Error creating invoice', error });
  }
};

export const sendInvoiceHandler = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    
    if (req.user.role !== 'orgAdmin') {
      return res.status(403).json({ message: 'Only organization admins can send invoices' });
    }
    
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (user?.organizationId !== invoice.organizationId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const sentInvoice = await sendInvoice(id);
    res.status(200).json(sentInvoice);
  } catch (error) {
    res.status(500).json({ message: 'Error sending invoice', error });
  }
};

export const downloadInvoicePDF = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    
    if (req.user.role === 'member' && invoice.memberId !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    if (req.user.role === 'orgAdmin') {
      const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
      if (user?.organizationId !== invoice.organizationId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    }
    
    const pdfUrl = await generateInvoicePDF(id);
    res.status(200).json({ pdfUrl });
  } catch (error) {
    res.status(500).json({ message: 'Error generating invoice PDF', error });
  }
};

export const markInvoicePaidHandler = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentId } = req.body;
    
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    
    if (req.user.role !== 'orgAdmin') {
      return res.status(403).json({ message: 'Only organization admins can mark invoices as paid' });
    }
    
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (user?.organizationId !== invoice.organizationId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const paidInvoice = await markInvoiceAsPaid(id, paymentId);
    res.status(200).json(paidInvoice);
  } catch (error) {
    res.status(500).json({ message: 'Error marking invoice as paid', error });
  }
};

export const voidInvoiceHandler = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    
    if (req.user.role !== 'orgAdmin') {
      return res.status(403).json({ message: 'Only organization admins can void invoices' });
    }
    
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (user?.organizationId !== invoice.organizationId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const voidedInvoice = await voidInvoice(id);
    res.status(200).json(voidedInvoice);
  } catch (error) {
    res.status(500).json({ message: 'Error voiding invoice', error });
  }
};

export const createOrganizationPlanInvoice = async (req: any, res: Response) => {
  try {
    const { orgId } = req.params;
    const { planId } = req.body;
    
    if (req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ message: 'Only SuperAdmin can create organization plan invoices' });
    }
    
    const organization = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!organization) return res.status(404).json({ message: 'Organization not found' });
    
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
    
    const invoice = await createInvoice({
      organizationId: orgId,
      planId,
      planType: 'organization',
      subtotal: plan.price,
      tax: 0,
      discount: 0,
      total: plan.price,
      dueDate,
      notes: `${plan.name} - Organization Plan Subscription`,
      items: [
        {
          description: `${plan.name} Organization Plan`,
          quantity: 1,
          unitPrice: plan.price,
          total: plan.price,
        },
      ],
    });
    
    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Error creating organization plan invoice', error });
  }
};
