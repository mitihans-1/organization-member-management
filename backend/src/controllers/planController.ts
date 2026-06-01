import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Default features for different plan tiers
const defaultFeatures = {
  free: ['overview', 'members', 'contact', 'subscriptions', 'payments', 'profile'],
  pro: ['overview', 'members', 'events', 'services', 'news', 'chat', 'contact', 'subscriptions', 'payments', 'profile', 'tickets'],
  enterprise: ['overview', 'members', 'events', 'services', 'news', 'chat', 'contact', 'subscriptions', 'payments', 'reports', 'id-cards', 'licenses', 'profile', 'tickets']
};

export const getPlans = async (req: Request, res: Response) => {
  try {
    let plans = await prisma.plan.findMany();

    // Add default allowed features if not present
    plans = plans.map((plan: any) => {
      let features = plan.allowed_features;
      
      if (!features || features.length === 0) {
        const nameLower = plan.name.toLowerCase();
        if (nameLower.includes('free')) {
          features = defaultFeatures.free;
        } else if (nameLower.includes('pro')) {
          features = defaultFeatures.pro;
        } else if (nameLower.includes('enterprise')) {
          features = defaultFeatures.enterprise;
        } else {
          features = defaultFeatures.free;
        }
      }
      
      return { ...plan, allowed_features: features };
    });

    res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching plans', error });
  }
};

export const createPlan = async (req: any, res: Response) => {
  try {
    const { name, price, billing_cycle, type, max_members, duration_days, allowed_features } = req.body;
    const plan = await prisma.plan.create({
      data: {
        name,
        price,
        billing_cycle,
        type,
        max_members,
        duration_days,
        allowed_features: allowed_features || [],
      } as any,
    });
    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Error creating plan', error });
  }
};

export const updatePlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, price, billing_cycle, type, max_members, duration_days, allowed_features } = req.body;
    const plan = await prisma.plan.update({
      where: { id: id },
      data: {
        name,
        price,
        billing_cycle,
        type,
        max_members,
        duration_days,
        allowed_features: allowed_features || [],
      } as any,
    });
    res.status(200).json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Error updating plan', error });
  }
};

export const deletePlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.plan.delete({
      where: { id: id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting plan', error });
  }
};
