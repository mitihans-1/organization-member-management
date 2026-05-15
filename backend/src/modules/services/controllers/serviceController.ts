import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getServices = async (req: any, res: Response) => {
  try {
    let where: any = {};
    
    // Fallback: If your token doesn't include organizationId, fetch it
    let orgId = req.user?.organizationId;
    if (!orgId && req.user?.userId) {
      const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
      orgId = user?.organizationId;
    }
    
    if (orgId) {
      // For organization members/admin: show predefined services + organization-specific services
      where = {
        OR: [
          { isPredefined: true },
          { organizationId: orgId }
        ]
      };
    } else {
      // For public/guest: show only predefined services
      where = { isPredefined: true };
    }

    const services = await prisma.service.findMany({
      where,
      include: {
        _count: {
          select: { subscribers: true },
        },
      },
    });
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching services', error });
  }
};

export const createService = async (req: any, res: Response) => {
  try {
    const { 
      title, code, description, image, status, category, 
      contactEmail, price, payment_required, owner, department, 
      duration, requiredDocuments, eligibilityRules, slaHours, 
      renewalRule, isPredefined
    } = req.body;
    const finalImage = req.file ? req.file.path : image;
    
    // Fallback: If your token doesn't include organizationId, fetch it
    let orgId = req.user?.organizationId;
    if (!orgId && req.user?.userId) {
      const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
      orgId = user?.organizationId;
    }

    const service = await prisma.service.create({
      data: {
        title,
        code: code || null,
        description,
        image: finalImage,
        category: category || 'general',
        categoryName: category || 'general',
        contactEmail: contactEmail || null,
        organizationId: orgId || null,
        status: status || 'Active',
        price: price ? parseFloat(price) : null,
        fee: price ? parseFloat(price) : null,
        payment_required: payment_required === true || payment_required === 'true',
        owner: owner || null,
        department: department || null,
        duration: duration || null,
        requiredDocuments: (requiredDocuments && requiredDocuments !== '') ? requiredDocuments.split(',').map((doc: string) => doc.trim()).filter(Boolean) : [],
        eligibilityRules: eligibilityRules || null,
        slaHours: slaHours ? parseInt(slaHours) : null,
        renewalRule: renewalRule || null,
        isPredefined: isPredefined === true || isPredefined === 'true',
      },
    });
    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: 'Error creating service', error });
  }
};

export const updateService = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      title, code, description, status, category, 
      contactEmail, price, payment_required, owner, department, 
      duration, requiredDocuments, eligibilityRules, slaHours, 
      renewalRule, isPredefined
    } = req.body;
    const image = req.file ? req.file.path : req.body.image;
    
    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (code !== undefined) updateData.code = code;
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    if (category !== undefined) {
      updateData.category = category;
      updateData.categoryName = category;
    }
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
    if (status !== undefined) updateData.status = status;
    if (price !== undefined) {
      updateData.price = price ? parseFloat(price) : null;
      updateData.fee = price ? parseFloat(price) : null;
    }
    if (payment_required !== undefined) updateData.payment_required = payment_required === true || payment_required === 'true';
    if (owner !== undefined) updateData.owner = owner;
    if (department !== undefined) updateData.department = department;
    if (duration !== undefined) updateData.duration = duration;
    if (requiredDocuments !== undefined && requiredDocuments !== null && requiredDocuments !== '') {
      updateData.requiredDocuments = requiredDocuments.split(',').map((doc: string) => doc.trim()).filter(Boolean);
    }
    if (eligibilityRules !== undefined) updateData.eligibilityRules = eligibilityRules;
    if (slaHours !== undefined) updateData.slaHours = slaHours ? parseInt(slaHours) : null;
    if (renewalRule !== undefined) updateData.renewalRule = renewalRule;
    if (isPredefined !== undefined) updateData.isPredefined = isPredefined === true || isPredefined === 'true';
    
    const service = await prisma.service.update({
      where: { id: id },
      data: updateData,
    });
    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({ message: 'Error updating service', error });
  }
};

export const deleteService = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.service.delete({
      where: { id: id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting service', error });
  }
};

export const subscribeToService = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const service = await prisma.service.findUnique({
      where: { id: id }
    });

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (service.payment_required) {
      return res.status(400).json({ message: 'This service requires payment. Please use the payment subscription flow.' });
    }

    // Check if already subscribed
    const alreadySubscribed = await prisma.service.findFirst({
      where: {
        id: id,
        subscribers: {
          some: { id: userId }
        }
      }
    });

    if (alreadySubscribed) {
      return res.status(400).json({ message: 'You are already subscribed to this service.' });
    }

    // Add user to service subscribers
    await prisma.service.update({
      where: { id: id },
      data: {
        subscribers: {
          connect: { id: userId }
        }
      }
    });

    res.status(200).json({ message: 'Successfully subscribed to service' });
  } catch (error) {
    console.error('Service Subscription Error:', error);
    res.status(500).json({ message: 'Error subscribing to service', error });
  }
};
