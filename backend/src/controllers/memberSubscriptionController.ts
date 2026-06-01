import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createInvoice } from '../services/invoiceService';
import { getRecurringPaymentsBySubscription } from '../services/invoiceService';
import { predefinedMemberPlans } from '../data/predefinedData';

const prisma = new PrismaClient();

type ResolvedMemberPlan = {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingCycle: string;
  durationDays: number;
  trialDays: number | null;
};

async function resolveMemberPlanForOrg(
  planId: string,
  organizationId: string,
): Promise<ResolvedMemberPlan | null> {
  const dbPlan = await prisma.memberSubscriptionPlan.findFirst({
    where: { id: planId, organizationId, isActive: true },
  });
  if (dbPlan) {
    return {
      id: dbPlan.id,
      name: dbPlan.name,
      price: dbPlan.price,
      currency: dbPlan.currency,
      billingCycle: dbPlan.billingCycle,
      durationDays: dbPlan.durationDays,
      trialDays: dbPlan.trialDays,
    };
  }
  const predefined = predefinedMemberPlans.find((p) => p.id === planId);
  if (predefined) {
    return {
      id: predefined.id,
      name: predefined.name,
      price: predefined.price,
      currency: predefined.currency,
      billingCycle: predefined.billingCycle,
      durationDays: predefined.durationDays,
      trialDays: predefined.trialDays ?? null,
    };
  }
  return null;
}

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
        organization: true,
        plan: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const subscriptionsWithPlans = subscriptions.map((sub) => {
      const plan =
        sub.plan ||
        predefinedMemberPlans.find((p) => p.id === sub.planId) ||
        null;
      return { ...sub, plan };
    });
    
    res.status(200).json(subscriptionsWithPlans);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subscriptions', error });
  }
};

export const getMemberSubscriptionsForMember = async (req: any, res: Response) => {
  try {
    const subscriptions = await prisma.memberSubscription.findMany({
      where: { memberId: req.user.userId },
      include: {
        organization: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Attach plan details
    const subscriptionsWithPlans = subscriptions.map(sub => {
      const plan = predefinedMemberPlans.find(p => p.id === sub.planId);
      return { ...sub, plan: plan || null };
    });
    
    res.status(200).json(subscriptionsWithPlans);
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
        organization: true,
        invoices: true,
      },
    });
    if (!subscription) return res.status(404).json({ message: 'Subscription not found' });
    
    // Attach plan details
    const plan = predefinedMemberPlans.find(p => p.id === subscription.planId);
    res.status(200).json({ ...subscription, plan: plan || null });
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

    const plan = await resolveMemberPlanForOrg(planId, orgId);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    const actualStartDate = startDate ? new Date(startDate) : new Date();
    const nextBillingDate = new Date(actualStartDate);
    nextBillingDate.setDate(nextBillingDate.getDate() + plan.durationDays);

    const subscription = await prisma.memberSubscription.create({
      data: {
        memberId,
        organizationId: orgId,
        planId: plan.id,
        status: 'active',
        startDate: actualStartDate,
        nextBillingDate,
        trialEndsAt: trialEndsAt ? new Date(trialEndsAt) : null,
      },
      include: {
        member: true,
        organization: true,
      },
    });

    const dueDate = new Date(actualStartDate);
    dueDate.setDate(dueDate.getDate() + 7);

    await createInvoice({
      organizationId: orgId,
      memberId,
      subscriptionId: subscription.id,
      planId: plan.id,
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

    res.status(201).json({ ...subscription, plan });
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
    
    const plan = predefinedMemberPlans.find(p => p.id === updatedSubscription.planId);
    res.status(200).json({ ...updatedSubscription, plan: plan || null });
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

    // Always return the predefined plans
    const plans = predefinedMemberPlans.map(p => ({
      ...p,
      organizationId: user.organizationId,
    }));
    
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

    // Get plan from predefined plans
    const plan = predefinedMemberPlans.find(p => p.id === planId);

    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    if (!plan.isActive) {
      return res.status(400).json({ message: 'Plan is not active' });
    }

    // If plan is free, activate subscription immediately without payment
    if (plan.price === 0) {
      // Check if user already has active subscription
      const existingActiveSubscription = await prisma.memberSubscription.findFirst({
        where: {
          memberId: req.user.userId,
          organizationId: user.organizationId,
          status: 'active',
        },
      });

      const actualStartDate = new Date();
      const nextBillingDate = new Date(actualStartDate);
      nextBillingDate.setDate(nextBillingDate.getDate() + plan.durationDays);

      const trialEndsAt = plan.trialDays
        ? new Date(actualStartDate.getTime() + plan.trialDays * 24 * 60 * 60 * 1000)
        : null;

      let subscription;

      if (existingActiveSubscription) {
        // Upgrade - cancel old subscription and create new one
        await prisma.memberSubscription.update({
          where: { id: existingActiveSubscription.id },
          data: {
            status: 'cancelled',
            cancellationDate: new Date(),
            cancellationReason: 'Upgraded to new plan',
            autoRenew: false,
          },
        });

        subscription = await prisma.memberSubscription.create({
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
            organization: true,
          },
        });
      } else {
        // First subscription
        subscription = await prisma.memberSubscription.create({
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
            organization: true,
          },
        });
      }

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
        notes: existingActiveSubscription
          ? `${plan.name} - ${plan.billingCycle} subscription (upgraded)`
          : `${plan.name} - ${plan.billingCycle} subscription (self-subscribed)`,
        items: [
          {
            description: `${plan.name} Subscription`,
            quantity: 1,
            unitPrice: plan.price,
            total: plan.price,
          },
        ],
      });

      return res.status(201).json({ ...subscription, plan });
    }

    // If plan is paid, return message that payment is required
    return res.status(200).json({
      message: 'Payment required for this plan',
      requiresPayment: true,
      plan: plan
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating subscription', error });
  }
};
