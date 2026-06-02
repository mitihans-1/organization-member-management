import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const deleteFileIfExists = (filePath: string) => {
  try {
    const normalized = filePath.replace(/\\/g, '/');
    const localPath = path.isAbsolute(normalized)
      ? normalized
      : path.join(process.cwd(), normalized);

    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
  } catch (error) {
    console.warn('Unable to delete old resource file:', error);
  }
};

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

export const getAllOrganizations = async (req: any, res: Response) => {
  try {
    const organizations = await prisma.organization.findMany({
      orderBy: { name: 'asc' }
    });
    res.status(200).json(organizations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching organizations', error });
  }
};

export const getOrganizationResources = async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user?.organizationId) {
      return res.status(404).json({ message: 'Organization not found for this user.' });
    }

    const resources = await prisma.organizationResource.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        fileName: true,
        filePath: true,
        mimeType: true,
        size: true,
        category: true,
        uploadedByName: true,
        createdAt: true,
      },
    });

    res.status(200).json(resources);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching resources', error });
  }
};

export const getOrganizationResource = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user?.organizationId) {
      return res.status(404).json({ message: 'Organization not found for this user.' });
    }

    const resource = await prisma.organizationResource.findUnique({ where: { id } });
    if (!resource || resource.organizationId !== user.organizationId) {
      return res.status(404).json({ message: 'Resource not found.' });
    }

    res.status(200).json(resource);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching resource', error });
  }
};

export const uploadOrganizationResource = async (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user?.organizationId) {
      return res.status(404).json({ message: 'Organization not found for this user.' });
    }
    if (user.role !== 'orgAdmin') {
      return res.status(403).json({ message: 'Only organization admins can upload resources.' });
    }

    const { title, description, category } = req.body;
    const name = title?.trim() || req.file.originalname;
    const categoryKey = category?.trim() || (req.file.mimetype.startsWith('image/') ? 'image' : 'file');

    const newResource = await prisma.organizationResource.create({
      data: {
        organizationId: user.organizationId,
        name,
        description: description?.trim() || null,
        fileName: req.file.originalname,
        filePath: req.file.path.replace(/\\/g, '/'),
        mimeType: req.file.mimetype,
        size: req.file.size,
        category: categoryKey,
        uploadedById: user.id,
        uploadedByName: user.name,
      },
    });

    res.status(201).json(newResource);
  } catch (error) {
    res.status(500).json({ message: 'Error uploading resource', error });
  }
};

export const updateOrganizationResource = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user?.organizationId) {
      return res.status(404).json({ message: 'Organization not found for this user.' });
    }
    if (user.role !== 'orgAdmin') {
      return res.status(403).json({ message: 'Only organization admins can modify resources.' });
    }

    const resource = await prisma.organizationResource.findUnique({ where: { id } });
    if (!resource || resource.organizationId !== user.organizationId) {
      return res.status(404).json({ message: 'Resource not found.' });
    }

    const updateData: any = {
      name: req.body.title?.trim() || resource.name,
      description: req.body.description?.trim() || resource.description,
      category: req.body.category?.trim() || resource.category,
    };

    if (req.file) {
      deleteFileIfExists(resource.filePath);
      updateData.fileName = req.file.originalname;
      updateData.filePath = req.file.path.replace(/\\/g, '/');
      updateData.mimeType = req.file.mimetype;
      updateData.size = req.file.size;
    }

    const updatedResource = await prisma.organizationResource.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json(updatedResource);
  } catch (error) {
    res.status(500).json({ message: 'Error updating resource', error });
  }
};

export const deleteOrganizationResource = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user?.organizationId) {
      return res.status(404).json({ message: 'Organization not found for this user.' });
    }
    if (user.role !== 'orgAdmin') {
      return res.status(403).json({ message: 'Only organization admins can delete resources.' });
    }

    const resource = await prisma.organizationResource.findUnique({ where: { id } });
    if (!resource || resource.organizationId !== user.organizationId) {
      return res.status(404).json({ message: 'Resource not found.' });
    }

    deleteFileIfExists(resource.filePath);
    await prisma.organizationResource.delete({ where: { id } });

    res.status(200).json({ message: 'Resource deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting resource', error });
  }
};

export const assignPlanToOrganization = async (req: any, res: Response) => {
  try {
    const { organizationId, planId } = req.body;
    
    // First find the org admin user for the organization
    const orgAdmin = await prisma.user.findFirst({
      where: {
        organizationId,
        role: 'orgAdmin'
      }
    });
    
    if (!orgAdmin) {
      return res.status(404).json({ message: 'Org admin not found for this organization.' });
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: orgAdmin.id },
      data: { plan_id: planId }
    });
    
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error assigning plan to organization', error });
  }
};
