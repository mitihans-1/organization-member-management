
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    const { orgId } = req.params;
    const { name, description, price, currency, billingCycle, durationDays, features, maxMembers, sortOrder } = req.body;

    if (req.user.role !== 'orgAdmin') {
      return res.status(403).json({ message: 'Only organization admins can create plans' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (user?.organizationId !== orgId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const plan = await prisma.memberSubscriptionPlan.create({
      data: {
        organizationId: orgId,
        name,
        description,
        price,
        currency: currency || 'ETB',
        billingCycle,
        durationDays,
        features: features || [],
        maxMembers,
        sortOrder: sortOrder || 0,
      },
    });

    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Error creating subscription plan', error });
  }
};

export const updateSubscriptionPlan = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, price, currency, billingCycle, durationDays, features, isActive, maxMembers, sortOrder } = req.body;

    if (req.user.role !== 'orgAdmin') {
      return res.status(403).json({ message: 'Only organization admins can update plans' });
    }

    const plan = await prisma.memberSubscriptionPlan.findUnique({ where: { id } });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (user?.organizationId !== plan.organizationId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const updatedPlan = await prisma.memberSubscriptionPlan.update({
      where: { id },
      data: {
        name,
        description,
        price,
        currency,
        billingCycle,
        durationDays,
        features,
        isActive,
        maxMembers,
        sortOrder,
      },
    });

    res.status(200).json(updatedPlan);
  } catch (error) {
    res.status(500).json({ message: 'Error updating subscription plan', error });
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
