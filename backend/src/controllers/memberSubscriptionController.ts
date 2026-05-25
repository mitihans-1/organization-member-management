
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createInvoice } from '../services/invoiceService';
import { getRecurringPaymentsBySubscription } from '../services/invoiceService';

const prisma = new PrismaClient();

export const getMemberSubscriptions = async (req: any, res: Response) => {
  try {
    const { orgId } = req.params;
    const where: any = { organizationId: orgId };

    if (req.user.role === 'member') {
      where.memberId = req.user.userId;
    }

    const subscriptions = await prisma.memberSubscription.findMany({
      where,
      include: {
        member: true,
        plan: true,
        organization: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(subscriptions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subscriptions', error });
  }
};

export const getMemberSubscriptionsForMember = async (req: any, res: Response) => {
  try {
    const subscriptions = await prisma.memberSubscription.findMany({
      where: { memberId: req.user.userId },
      include: {
        plan: true,
        organization: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(subscriptions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching member subscriptions', error });
  }
};

export const getMemberSubscriptionById = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const subscription = await prisma.memberSubscription.findUnique({
      where: { id },
      include: {
        member: true,
        plan: true,
        organization: true,
        invoices: true,
      },
    });
    if (!subscription) return res.status(404).json({ message: 'Subscription not found' });
    res.status(200).json(subscription);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subscription', error });
  }
};

export const getRecurringPayments = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const subscription = await prisma.memberSubscription.findUnique({ where: { id } });
    if (!subscription) return res.status(404).json({ message: 'Subscription not found' });

    if (req.user.role === 'orgAdmin') {
      const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
      if (user?.organizationId !== subscription.organizationId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    } else if (req.user.role === 'member' && req.user.userId !== subscription.memberId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const recurringPayments = await getRecurringPaymentsBySubscription(id);
    res.status(200).json(recurringPayments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recurring payments', error });
  }
};

export const createMemberSubscription = async (req: any, res: Response) => {
  try {
    const { orgId, memberId } = req.params;
    const { planId, startDate, trialEndsAt } = req.body;

    if (req.user.role !== 'orgAdmin') {
      return res.status(403).json({ message: 'Only organization admins can create subscriptions' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (user?.organizationId !== orgId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const plan = await prisma.memberSubscriptionPlan.findUnique({ where: { id: planId } }) as any;
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    const actualStartDate = startDate ? new Date(startDate) : new Date();
    const nextBillingDate = new Date(actualStartDate);
    nextBillingDate.setDate(nextBillingDate.getDate() + plan.durationDays);

    const subscription = await prisma.memberSubscription.create({
      data: {
        memberId,
        organizationId: orgId,
        planId,
        status: 'active',
        startDate: actualStartDate,
        nextBillingDate,
        trialEndsAt: trialEndsAt ? new Date(trialEndsAt) : null,
      },
      include: {
        member: true,
        plan: true,
      },
    });

    const dueDate = new Date(actualStartDate);
    dueDate.setDate(dueDate.getDate() + 7);

    await createInvoice({
      organizationId: orgId,
      memberId,
      subscriptionId: subscription.id,
      planId,
      planType: 'member',
      subtotal: plan.price,
      tax: 0,
      discount: 0,
      total: plan.price,
      dueDate,
      billingPeriodStart: actualStartDate,
      billingPeriodEnd: nextBillingDate,
      isRecurring: true,
      notes: `${plan.name} - ${plan.billingCycle} subscription`,
      items: [
        {
          description: `${plan.name} Subscription`,
          quantity: 1,
          unitPrice: plan.price,
          total: plan.price,
        },
      ],
    });

    res.status(201).json(subscription);
  } catch (error) {
    res.status(500).json({ message: 'Error creating subscription', error });
  }
};

export const updateMemberSubscription = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { planId, status, autoRenew } = req.body;

    const subscription = await prisma.memberSubscription.findUnique({ where: { id } });
    if (!subscription) return res.status(404).json({ message: 'Subscription not found' });

    if (req.user.role === 'orgAdmin') {
      const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
      if (user?.organizationId !== subscription.organizationId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    } else if (req.user.role === 'member' && req.user.userId !== subscription.memberId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const updatedSubscription = await prisma.memberSubscription.update({
      where: { id },
      data: {
        planId,
        status,
        autoRenew,
      },
    });

    res.status(200).json(updatedSubscription);
  } catch (error) {
    res.status(500).json({ message: 'Error updating subscription', error });
  }
};

export const cancelMemberSubscription = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const subscription = await prisma.memberSubscription.findUnique({ where: { id } });
    if (!subscription) return res.status(404).json({ message: 'Subscription not found' });

    if (req.user.role === 'orgAdmin') {
      const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
      if (user?.organizationId !== subscription.organizationId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    } else if (req.user.role === 'member' && req.user.userId !== subscription.memberId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const updatedSubscription = await prisma.memberSubscription.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancellationDate: new Date(),
        cancellationReason: reason,
        autoRenew: false,
      },
    });

    res.status(200).json(updatedSubscription);
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling subscription', error });
  }
};

export const pauseMemberSubscription = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'orgAdmin') {
      return res.status(403).json({ message: 'Only organization admins can pause subscriptions' });
    }

    const subscription = await prisma.memberSubscription.findUnique({ where: { id } });
    if (!subscription) return res.status(404).json({ message: 'Subscription not found' });

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (user?.organizationId !== subscription.organizationId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const updatedSubscription = await prisma.memberSubscription.update({
      where: { id },
      data: { status: 'paused' },
    });

    res.status(200).json(updatedSubscription);
  } catch (error) {
    res.status(500).json({ message: 'Error pausing subscription', error });
  }
};

export const resumeMemberSubscription = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'orgAdmin') {
      return res.status(403).json({ message: 'Only organization admins can resume subscriptions' });
    }

    const subscription = await prisma.memberSubscription.findUnique({ where: { id } });
    if (!subscription) return res.status(404).json({ message: 'Subscription not found' });

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (user?.organizationId !== subscription.organizationId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const updatedSubscription = await prisma.memberSubscription.update({
      where: { id },
      data: { status: 'active' },
    });

    res.status(200).json(updatedSubscription);
  } catch (error) {
    res.status(500).json({ message: 'Error resuming subscription', error });
  }
};

export const getAvailablePlansForMember = async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user?.organizationId) {
      return res.status(400).json({ message: 'User not part of any organization' });
    }

    const plans = await prisma.memberSubscriptionPlan.findMany({
      where: {
        organizationId: user.organizationId,
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching available plans', error });
  }
};

export const memberSelfSubscribe = async (req: any, res: Response) => {
  try {
    const { planId } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });

    if (!user?.organizationId) {
      return res.status(400).json({ message: 'User not part of any organization' });
    }

    const plan = await prisma.memberSubscriptionPlan.findUnique({
      where: { id: planId },
    }) as any;
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    if (!plan.isActive) {
      return res.status(400).json({ message: 'Plan is not active' });
    }

    const actualStartDate = new Date();
    const nextBillingDate = new Date(actualStartDate);
    nextBillingDate.setDate(nextBillingDate.getDate() + plan.durationDays);

    const trialEndsAt = plan.trialDays
      ? new Date(actualStartDate.getTime() + plan.trialDays * 24 * 60 * 60 * 1000)
      : null;

    const subscription = await prisma.memberSubscription.create({
      data: {
        memberId: req.user.userId,
        organizationId: user.organizationId,
        planId,
        status: 'active',
        startDate: actualStartDate,
        nextBillingDate,
        trialEndsAt,
      },
      include: {
        member: true,
        plan: true,
        organization: true,
      },
    });

    const dueDate = new Date(actualStartDate);
    dueDate.setDate(dueDate.getDate() + 7);

    await createInvoice({
      organizationId: user.organizationId,
      memberId: req.user.userId,
      subscriptionId: subscription.id,
      planId,
      planType: 'member',
      subtotal: plan.price,
      tax: 0,
      discount: 0,
      total: plan.price,
      dueDate,
      billingPeriodStart: actualStartDate,
      billingPeriodEnd: nextBillingDate,
      isRecurring: true,
      notes: `${plan.name} - ${plan.billingCycle} subscription (self-subscribed)`,
      items: [
        {
          description: `${plan.name} Subscription`,
          quantity: 1,
          unitPrice: plan.price,
          total: plan.price,
        },
      ],
    });

    res.status(201).json(subscription);
  } catch (error) {
    res.status(500).json({ message: 'Error creating subscription', error });
  }
};
