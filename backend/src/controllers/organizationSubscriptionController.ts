
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createInvoice } from '../services/invoiceService';

const prisma = new PrismaClient();

export const getAvailablePlansForOrganization = async (req: any, res: Response) => {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { createdAt: 'asc' },
    });
    res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching plans', error });
  }
};

export const organizationSelfSubscribe = async (req: any, res: Response) => {
  try {
    const { planId } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });

    if (!user?.organizationId) {
      return res.status(400).json({ message: 'User not part of any organization' });
    }

    const organization = await prisma.organization.findUnique({ where: { id: user.organizationId } });
    if (!organization) return res.status(404).json({ message: 'Organization not found' });

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    const updatedOrganization = await prisma.organization.update({
      where: { id: user.organizationId },
      data: {
        plan_id: planId,
        plan_expiry: new Date(Date.now() + plan.duration_days * 24 * 60 * 60 * 1000),
      },
    });

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    const billingEndDate = new Date(Date.now() + plan.duration_days * 24 * 60 * 60 * 1000);

    await createInvoice({
      organizationId: user.organizationId,
      planId,
      planType: 'organization',
      subtotal: plan.price,
      tax: 0,
      discount: 0,
      total: plan.price,
      dueDate,
      billingPeriodStart: new Date(),
      billingPeriodEnd: billingEndDate,
      isRecurring: true,
      notes: `${plan.name} - Organization plan (self-subscribed)`,
      items: [
        {
          description: `${plan.name} Organization Plan`,
          quantity: 1,
          unitPrice: plan.price,
          total: plan.price,
        },
      ],
    });

    res.status(200).json(updatedOrganization);
  } catch (error) {
    res.status(500).json({ message: 'Error subscribing to plan', error });
  }
};

export const assignOrganizationPlan = async (req: any, res: Response) => {
  try {
    const { organizationId } = req.params;
    const { planId, skipPayment = false } = req.body;

    if (req.user.role !== 'superAdmin') {
      return res.status(403).json({ message: 'Only super admins can assign organization plans' });
    }

    const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!organization) return res.status(404).json({ message: 'Organization not found' });

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    const updatedOrganization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        plan_id: planId,
        plan_expiry: new Date(Date.now() + plan.duration_days * 24 * 60 * 60 * 1000),
      },
    });

    // Only create invoice if skipPayment is false
    if (!skipPayment) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      const billingEndDate = new Date(Date.now() + plan.duration_days * 24 * 60 * 60 * 1000);

      await createInvoice({
        organizationId,
        planId,
        planType: 'organization',
        subtotal: plan.price,
        tax: 0,
        discount: 0,
        total: plan.price,
        dueDate,
        billingPeriodStart: new Date(),
        billingPeriodEnd: billingEndDate,
        isRecurring: true,
        notes: `${plan.name} - Organization plan (assigned by super admin)`,
        items: [
          {
            description: `${plan.name} Organization Plan`,
            quantity: 1,
            unitPrice: plan.price,
            total: plan.price,
          },
        ],
      });
    }

    res.status(200).json(updatedOrganization);
  } catch (error) {
    res.status(500).json({ message: 'Error assigning organization plan', error });
  }
};

export const getOrganizationInvoices = async (req: any, res: Response) => {
  try {
    const { organizationId } = req.params;

    if (req.user.role !== 'superAdmin') {
      return res.status(403).json({ message: 'Only super admins can view organization invoices' });
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        organizationId,
        planType: 'organization',
      },
      include: {
        items: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching organization invoices', error });
  }
};
