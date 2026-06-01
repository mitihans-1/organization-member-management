import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Public list for member registration — id + name only. */
export const listPublicOrganizations = async (_req: Request, res: Response) => {
  try {
    // Backfill missing organization records for org admins created via legacy/admin flows.
    const orgAdmins = await prisma.user.findMany({
      where: { role: 'orgAdmin' },
      select: {
        id: true,
        organizationId: true,
        organization_name: true,
        organization_type: true,
      },
    });

    // Get or create free plan
    let freePlan = await prisma.plan.findFirst({ where: { name: 'Free' } });
    if (!freePlan) {
      const defaultFeatures = ['overview', 'members', 'contact', 'subscriptions', 'payments', 'profile'];
      // @ts-ignore: Prisma client needs regeneration
      freePlan = await prisma.plan.create({
        data: {
          name: 'Free',
          price: 0,
          billing_cycle: 'monthly',
          type: 'Standard',
          max_members: 10,
          duration_days: 30,
          // @ts-ignore: Prisma client needs regeneration
          allowed_features: defaultFeatures,
        },
      });
    }

    for (const admin of orgAdmins) {
      const name = admin.organization_name?.trim();
      if (!name) continue;

      const expectedType = admin.organization_type?.trim() || 'business';
      const linkedOrg = admin.organizationId
        ? await prisma.organization.findUnique({
            where: { id: admin.organizationId },
            select: { id: true, name: true, type: true, plan_id: true },
          })
        : null;

      const needsNewOrg =
        !linkedOrg || linkedOrg.name !== name || (admin.organization_type?.trim() && linkedOrg.type !== expectedType);

      if (needsNewOrg) {
        const created = await prisma.organization.create({
          data: {
            name,
            type: expectedType,
            plan_id: freePlan.id, // Assign free plan
          },
          select: { id: true },
        });

        await prisma.user.update({
          where: { id: admin.id },
          data: { organizationId: created.id },
        });
      } else if (linkedOrg && !linkedOrg.plan_id) {
        // Assign free plan to existing org if it doesn't have one
        await prisma.organization.update({
          where: { id: linkedOrg.id },
          data: { plan_id: freePlan.id },
        });
      }
    }

    const organizations = await prisma.organization.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    res.status(200).json(organizations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching organizations', error });
  }
};

// Super admin: get all organizations
export const getAllOrganizations = async (req: any, res: Response) => {
  try {
    if (req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ message: 'Only super admin can view all organizations.' });
    }

    const organizations = await prisma.organization.findMany({
      include: { plan: true },
      orderBy: { name: 'asc' },
    });
    res.status(200).json(organizations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching organizations', error });
  }
};

// Super admin: assign plan to organization
export const assignPlanToOrganization = async (req: any, res: Response) => {
  try {
    if (req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ message: 'Only super admin can assign plans.' });
    }

    const { organizationId, planId, planExpiryDays } = req.body;

    if (!organizationId || !planId) {
      return res.status(400).json({ message: 'Organization ID and Plan ID are required.' });
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found.' });
    }

    const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found.' });
    }

    let planExpiry = null;
    if (planExpiryDays) {
      planExpiry = new Date();
      planExpiry.setDate(planExpiry.getDate() + planExpiryDays);
    } else if (plan.duration_days) {
      planExpiry = new Date();
      planExpiry.setDate(planExpiry.getDate() + plan.duration_days);
    }

    const updatedOrganization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        plan_id: planId,
        plan_expiry: planExpiry,
      },
      include: { plan: true },
    });

    res.status(200).json({ message: 'Plan assigned successfully.', organization: updatedOrganization });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning plan', error });
  }
};

export const getMyOrganization = async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });
    
    if (!user?.organizationId) {
      return res.status(404).json({ message: 'Organization not found for this user.' });
    }
    
    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId },
    });
    
    res.status(200).json(org);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching organization', error });
  }
};

export const updateMyOrganization = async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });
    
    if (!user?.organizationId) {
      return res.status(404).json({ message: 'Organization not found for this user.' });
    }
    
    if (user.role !== 'orgAdmin') {
      return res.status(403).json({ message: 'Only org admins can update organization settings.' });
    }

    const { payment_phone } = req.body;
    
    const updatedOrg = await prisma.organization.update({
      where: { id: user.organizationId },
      data: {
        payment_phone,
      },
    });
    
    res.status(200).json(updatedOrg);
  } catch (error) {
    res.status(500).json({ message: 'Error updating organization', error });
  }
};
