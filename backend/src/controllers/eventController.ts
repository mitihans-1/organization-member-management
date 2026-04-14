import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getEvents = async (req: Request, res: Response) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        _count: {
          select: { attendees: true },
        },
      },
    });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events', error });
  }
};

export const createEvent = async (req: any, res: Response) => {
  try {
    const { title, description, date, end_date, location, image, status, category, capacity, virtualLink, contactEmail } = req.body;
    
    // Fallback: If your token doesn't include organizationId, fetch it
    let orgId = req.user?.organizationId;
    if (!orgId && req.user?.userId) {
      const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
      orgId = user?.organizationId;
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        date: new Date(date),
        end_date: end_date ? new Date(end_date) : undefined,
        location,
        image,
        category: category || 'general',
        capacity: capacity ? parseInt(capacity) : null,
        virtualLink: virtualLink || null,
        contactEmail: contactEmail || null,
        organizationId: orgId || null,
        status: status || 'draft',
      },
    });
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Error creating event', error });
  }
};

export const updateEvent = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, date, end_date, location, image, status, category, capacity, virtualLink, contactEmail } = req.body;
    const event = await prisma.event.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        date: new Date(date),
        end_date: end_date ? new Date(end_date) : undefined,
        location,
        image,
        category: category || undefined,
        capacity: capacity !== undefined ? parseInt(capacity) : null,
        virtualLink: virtualLink !== undefined ? virtualLink : null,
        contactEmail: contactEmail !== undefined ? contactEmail : null,
        status: status || 'draft',
      },
    });
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Error updating event', error });
  }
};

export const deleteEvent = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.event.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting event', error });
  }
};
