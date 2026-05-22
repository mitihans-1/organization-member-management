import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const getOrganizations = async (req: any, res: Response) => {
  if (req.user.role !== 'SuperAdmin') {
    return res.status(403).json({ message: 'Forbidden: SuperAdmin only' });
  }

  try {
    const organizations = await prisma.organization.findMany({
      include: {
        users: {
          where: { role: 'orgAdmin' },
          include: { plan: true, members: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.status(200).json(organizations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching organizations', error });
  }
};

export const getAllOrganizations = async (req: any, res: Response) => {
  if (req.user.role !== 'SuperAdmin') {
    return res.status(403).json({ message: 'Forbidden: SuperAdmin only' });
  }

  try {
    const organizations = await prisma.organization.findMany({
      orderBy: { name: 'asc' }
    });
    res.status(200).json(organizations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching organizations', error });
  }
};

export const createOrganization = async (req: any, res: Response) => {
  if (req.user.role !== 'SuperAdmin') {
    return res.status(403).json({ message: 'Forbidden: SuperAdmin only' });
  }

  try {
    const { name, email, password, organization_name, organization_type, plan_id } = req.body;
    const orgName = String(organization_name || '').trim();
    const orgType = String(organization_type || 'business').trim() || 'business';

    const organizationRow = await prisma.organization.create({
      data: {
        name: orgName,
        type: orgType,
      },
    });

    let organization;
    if (name && email && password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      organization = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          organization_name: orgName,
          organization_type: orgType,
          organizationId: organizationRow.id,
          role: 'orgAdmin',
          plan_id: plan_id ? plan_id : undefined,
          is_verified: false,
        },
      });
    } else {
      organization = organizationRow;
    }

    res.status(201).json(organization);
  } catch (error) {
    res.status(500).json({ message: 'Error creating organization', error });
  }
};

export const updateOrganization = async (req: any, res: Response) => {
  if (req.user.role !== 'SuperAdmin') {
    return res.status(403).json({ message: 'Forbidden: SuperAdmin only' });
  }

  try {
    const { id } = req.params;
    const { name, email, organization_name, organization_type, plan_id } = req.body;
    const orgName = String(organization_name || '').trim();
    const orgType = String(organization_type || 'business').trim() || 'business';
    const userId = id;

    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    let organizationId = current?.organizationId || null;

    if (organizationId) {
      await prisma.organization.update({
        where: { id: organizationId },
        data: { name: orgName, type: orgType },
      });
    } else if (orgName) {
      const created = await prisma.organization.create({
        data: { name: orgName, type: orgType },
        select: { id: true },
      });
      organizationId = created.id;
    }

    const organization = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        organization_name: orgName,
        organization_type: orgType,
        organizationId: organizationId || undefined,
        plan_id: plan_id ? plan_id : undefined,
      },
    });

    res.status(200).json(organization);
  } catch (error) {
    res.status(500).json({ message: 'Error updating organization', error });
  }
};

export const deleteOrganization = async (req: any, res: Response) => {
  if (req.user.role !== 'SuperAdmin') {
    return res.status(403).json({ message: 'Forbidden: SuperAdmin only' });
  }

  try {
    const { id } = req.params;
    
    // First check if id is a user or organization
    const user = await prisma.user.findUnique({ where: { id } });
    if (user && user.organizationId) {
      // Delete both user and organization
      await prisma.user.delete({ where: { id } });
      await prisma.organization.delete({ where: { id: user.organizationId } });
    } else {
      // Delete organization directly
      await prisma.organization.delete({ where: { id } });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting organization', error });
  }
};

export const createOrgAdmin = async (req: any, res: Response) => {
  if (req.user.role !== 'SuperAdmin') {
    return res.status(403).json({ message: 'Forbidden: SuperAdmin only' });
  }

  try {
    const { name, email, password, organization_id, plan_id } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const organization = await prisma.organization.findUnique({
      where: { id: organization_id },
    });

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const orgAdmin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        organization_name: organization.name,
        organization_type: organization.type,
        organizationId: organization.id,
        role: 'orgAdmin',
        plan_id: plan_id ? plan_id : undefined,
        is_verified: false,
      },
    });

    res.status(201).json(orgAdmin);
  } catch (error) {
    res.status(500).json({ message: 'Error creating org admin', error });
  }
};
