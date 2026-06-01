import { Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getLicensePlans = async (req: any, res: Response) => {
  try {
    const { organizationId } = req.params;
    const { licenseType } = req.query;

    const where: any = { organizationId, isActive: true };
    if (licenseType) {
      where.licenseType = licenseType;
    }

    const plans = await prisma.licensePlan.findMany({
      where,
      orderBy: { sortOrder: 'asc' }
    });

    res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching license plans', error });
  }
};

export const getOrgLicensePlans = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const admin = await prisma.user.findUnique({ where: { id: userId } });
    if (!admin?.organizationId) return res.status(403).json({ message: 'No organization access' });

    const plans = await prisma.licensePlan.findMany({
      where: { organizationId: admin.organizationId },
      orderBy: { sortOrder: 'asc' }
    });

    res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching license plans', error });
  }
};

export const createLicensePlan = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const admin = await prisma.user.findUnique({ where: { id: userId } });
    if (!admin?.organizationId) return res.status(403).json({ message: 'No organization access' });

    const { name, description, price, currency, licenseType, durationDays, features, sortOrder } = req.body;

    const plan = await prisma.licensePlan.create({
      data: {
        organizationId: admin.organizationId,
        name,
        description,
        price: parseFloat(price),
        currency: currency || 'ETB',
        licenseType,
        durationDays: parseInt(durationDays),
        features: features ? features.split(',').map((f: string) => f.trim()).filter(Boolean) : [],
        sortOrder: sortOrder ? parseInt(sortOrder) : 0
      }
    });

    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Error creating license plan', error });
  }
};

export const updateLicensePlan = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const admin = await prisma.user.findUnique({ where: { id: userId } });
    if (!admin?.organizationId) return res.status(403).json({ message: 'No organization access' });

    const { id } = req.params;
    const { name, description, price, currency, licenseType, durationDays, features, isActive, sortOrder } = req.body;

    const existingPlan = await prisma.licensePlan.findUnique({ where: { id } });
    if (!existingPlan || existingPlan.organizationId !== admin.organizationId) {
      return res.status(403).json({ message: 'No access to this plan' });
    }

    const plan = await prisma.licensePlan.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        price: price !== undefined ? parseFloat(price) : undefined,
        currency: currency !== undefined ? currency : undefined,
        licenseType: licenseType !== undefined ? licenseType : undefined,
        durationDays: durationDays !== undefined ? parseInt(durationDays) : undefined,
        features: features !== undefined ? features.split(',').map((f: string) => f.trim()).filter(Boolean) : undefined,
        isActive: isActive !== undefined ? (isActive === true || isActive === 'true') : undefined,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : undefined
      }
    });

    res.status(200).json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Error updating license plan', error });
  }
};

export const deleteLicensePlan = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const admin = await prisma.user.findUnique({ where: { id: userId } });
    if (!admin?.organizationId) return res.status(403).json({ message: 'No organization access' });

    const { id } = req.params;
    const existingPlan = await prisma.licensePlan.findUnique({ where: { id } });
    if (!existingPlan || existingPlan.organizationId !== admin.organizationId) {
      return res.status(403).json({ message: 'No access to this plan' });
    }

    await prisma.licensePlan.delete({ where: { id } });
    res.status(200).json({ message: 'License plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting license plan', error });
  }
};
