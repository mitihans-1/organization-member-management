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

    for (const admin of orgAdmins) {
      const name = admin.organization_name?.trim();
      if (!name) continue;

      const expectedType = admin.organization_type?.trim() || 'business';
      const linkedOrg = admin.organizationId
        ? await prisma.organization.findUnique({
            where: { id: admin.organizationId },
            select: { id: true, name: true, type: true },
          })
        : null;

      const needsNewOrg =
        !linkedOrg || linkedOrg.name !== name || (admin.organization_type?.trim() && linkedOrg.type !== expectedType);

      if (needsNewOrg) {
        const created = await prisma.organization.create({
          data: {
            name,
            type: expectedType,
          },
          select: { id: true },
        });

        await prisma.user.update({
          where: { id: admin.id },
          data: { organizationId: created.id },
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
