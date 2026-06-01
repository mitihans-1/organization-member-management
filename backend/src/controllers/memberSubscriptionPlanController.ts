
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define member-specific features that are allowed in member subscription plans
const MEMBER_SPECIFIC_FEATURES = [
  'overview',
  'events',
  'services',
  'news',
  'contact',
  'subscriptions',
  'payments',
  'tickets',
  'chat',
  'id-cards',
  'licenses',
  'profile',
];

export const getSubscriptionPlans = async (req: any, res: Response) => {
  try {
    const { orgId } = req.params;
    const plans = await prisma.memberSubscriptionPlan.findMany({
      where: { organizationId: orgId },
      orderBy: { sortOrder: 'asc' },
    });
    res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subscription plans', error });
  }
};

export const getSubscriptionPlanById = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const plan = await prisma.memberSubscriptionPlan.findUnique({
      where: { id },
      include: { organization: true },
    });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.status(200).json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subscription plan', error });
  }
};

export const createSubscriptionPlan = async (req: any, res: Response) => {
  try {
    console.log('Creating subscription plan - req.body:', req.body);
    console.log('req.params:', req.params);
    console.log('req.user:', req.user);

    const { orgId } = req.params;
    const { name, description, price, currency, billingCycle, durationDays, features, maxMembers, sortOrder, trialDays, isActive } = req.body;

    if (req.user.role !== 'orgAdmin') {
      return res.status(403).json({ message: 'Only organization admins can create plans' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    console.log('Found user:', user);
    if (user?.organizationId !== orgId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Validate that all features are member-specific
    if (features) {
      const invalidFeatures = features.filter((f: string) => !MEMBER_SPECIFIC_FEATURES.includes(f));
      if (invalidFeatures.length > 0) {
        return res.status(400).json({ message: `Invalid features: ${invalidFeatures.join(', ')}` });
      }
    }

    const planData = {
      organizationId: orgId,
      name,
      description,
      price: typeof price === 'string' ? parseFloat(price) : price,
      currency: currency || 'ETB',
      billingCycle,
      durationDays: typeof durationDays === 'string' ? parseInt(durationDays) : durationDays,
      features: features || [],
      maxMembers: maxMembers ? (typeof maxMembers === 'string' ? parseInt(maxMembers) : maxMembers) : null,
      sortOrder: sortOrder !== undefined ? (typeof sortOrder === 'string' ? parseInt(sortOrder) : sortOrder) : 0,
      trialDays: trialDays ? (typeof trialDays === 'string' ? parseInt(trialDays) : trialDays) : null,
      isActive: isActive !== undefined ? isActive : true,
    };
    console.log('Plan data to create:', planData);

    const plan = await prisma.memberSubscriptionPlan.create({
      data: planData,
    });

    console.log('Created plan:', plan);
    res.status(201).json(plan);
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    res.status(500).json({ message: 'Error creating subscription plan', error: (error as Error).message });
  }
};

export const updateSubscriptionPlan = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, price, currency, billingCycle, durationDays, features, isActive, maxMembers, sortOrder, trialDays } = req.body;

    if (req.user.role !== 'orgAdmin') {
      return res.status(403).json({ message: 'Only organization admins can update plans' });
    }

    const plan = await prisma.memberSubscriptionPlan.findUnique({ where: { id } });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (user?.organizationId !== plan.organizationId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Validate that all features are member-specific if features are provided
    if (features) {
      const invalidFeatures = features.filter((f: string) => !MEMBER_SPECIFIC_FEATURES.includes(f));
      if (invalidFeatures.length > 0) {
        return res.status(400).json({ message: `Invalid features: ${invalidFeatures.join(', ')}` });
      }
    }

    const updatedPlan = await prisma.memberSubscriptionPlan.update({
      where: { id },
      data: {
        name,
        description,
        price: price !== undefined ? (typeof price === 'string' ? parseFloat(price) : price) : undefined,
        currency,
        billingCycle,
        durationDays: durationDays !== undefined ? (typeof durationDays === 'string' ? parseInt(durationDays) : durationDays) : undefined,
        features,
        isActive,
        maxMembers: maxMembers !== undefined ? (maxMembers ? (typeof maxMembers === 'string' ? parseInt(maxMembers) : maxMembers) : null) : undefined,
        sortOrder: sortOrder !== undefined ? (typeof sortOrder === 'string' ? parseInt(sortOrder) : sortOrder) : undefined,
        trialDays: trialDays !== undefined ? (trialDays ? (typeof trialDays === 'string' ? parseInt(trialDays) : trialDays) : null) : undefined,
      },
    });

    res.status(200).json(updatedPlan);
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    res.status(500).json({ message: 'Error updating subscription plan', error: (error as Error).message });
  }
};

export const deleteSubscriptionPlan = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'orgAdmin') {
      return res.status(403).json({ message: 'Only organization admins can delete plans' });
    }

    const plan = await prisma.memberSubscriptionPlan.findUnique({ where: { id } });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (user?.organizationId !== plan.organizationId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await prisma.memberSubscriptionPlan.update({
      where: { id },
      data: { isActive: false },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting subscription plan', error });
  }
};
