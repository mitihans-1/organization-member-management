import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { optionalAuthenticateToken } from '../middleware/authMiddleware';
import { resolveRequestContext } from '../utils/catalogScope';

const prisma = new PrismaClient();

/** Organizations that shared a message for the home testimonials section */
export const getPublicTestimonials = async (_req: Request, res: Response) => {
  try {
    const orgs = await prisma.organization.findMany({
      where: {
        OR: [
          { testimonialQuote: { not: null } },
          { aboutSubtitle: { not: null } },
          { aboutStory: { not: null } },
        ],
      },
      select: {
        id: true,
        name: true,
        testimonialQuote: true,
        aboutSubtitle: true,
        aboutStory: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 30,
    });

    const testimonials = orgs
      .map((org) => {
        const quote =
          org.testimonialQuote?.trim() ||
          org.aboutSubtitle?.trim() ||
          (org.aboutStory?.trim() ? org.aboutStory.trim().slice(0, 280) : null);
        if (!quote) return null;
        return {
          id: org.id,
          quote,
          name: org.name,
          role: 'Partner Organization',
        };
      })
      .filter(Boolean);

    res.status(200).json(testimonials);
  } catch (error: any) {
    res.status(500).json({ message: 'Error loading testimonials', error: error.message });
  }
};

/** Platform plans for guests/org admins; org member plans for logged-in members */
export const getPublicPricingPlans = async (req: any, res: Response) => {
  try {
    const ctx = await resolveRequestContext(req);

    if (ctx.role === 'member' && ctx.organizationId) {
      const plans = await prisma.memberSubscriptionPlan.findMany({
        where: { organizationId: ctx.organizationId, isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }],
      });
      return res.status(200).json({
        source: 'organization',
        organizationId: ctx.organizationId,
        plans: plans.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          billing_cycle: p.billingCycle,
          currency: p.currency,
          max_members: p.maxMembers,
          duration_days: p.durationDays,
          features: p.features,
          trialDays: p.trialDays,
        })),
      });
    }

    const plans = await prisma.plan.findMany({
      orderBy: { price: 'asc' },
    });

    res.status(200).json({
      source: 'platform',
      plans: plans.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        billing_cycle: p.billing_cycle,
        type: p.type,
        max_members: p.max_members,
        duration_days: p.duration_days,
        features: [
          `Up to ${p.max_members} members`,
          `${p.billing_cycle} billing`,
          `${p.duration_days}-day term`,
        ],
      })),
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error loading pricing plans', error: error.message });
  }
};

export const homePublicRoutes = {
  getPublicTestimonials,
  getPublicPricingPlans,
};
