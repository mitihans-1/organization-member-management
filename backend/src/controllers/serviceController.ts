import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getServices = async (req: Request, res: Response) => {
  try {
    const services = await prisma.service.findMany({
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
      title, description, image, status, category, 
      contactEmail, price, payment_required 
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
        description,
        image: finalImage,
        category: category || 'general',
        contactEmail: contactEmail || null,
        organizationId: orgId || null,
        status: status || 'draft',
        price: price ? parseFloat(price) : null,
        payment_required: payment_required === true || payment_required === 'true',
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
      title, description, status, category, 
      contactEmail, price, payment_required 
    } = req.body;
    const image = req.file ? req.file.path : req.body.image;
    const service = await prisma.service.update({
      where: { id: id },
      data: {
        title,
        description,
        image,
        category: category || undefined,
        contactEmail: contactEmail !== undefined ? contactEmail : null,
        status: status || 'draft',
        price: price !== undefined ? parseFloat(price) : null,
        payment_required: payment_required !== undefined ? (payment_required === true || payment_required === 'true') : undefined,
      },
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
