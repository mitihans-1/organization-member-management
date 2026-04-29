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
    const { 
      title, description, date, end_date, location, image, status, category, 
      capacity, virtualLink, contactEmail, price, payment_required 
    } = req.body;
    const finalImage = req.file ? req.file.path : image;
    
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
        image: finalImage,
        category: category || 'general',
        capacity: capacity ? parseInt(capacity) : null,
        virtualLink: virtualLink || null,
        contactEmail: contactEmail || null,
        organizationId: orgId || null,
        status: status || 'draft',
        price: price ? parseFloat(price) : null,
        payment_required: payment_required === true || payment_required === 'true',
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
    const { 
      title, description, date, end_date, location, status, category, 
      capacity, virtualLink, contactEmail, price, payment_required 
    } = req.body;
    const image = req.file ? req.file.path : req.body.image;
    const event = await prisma.event.update({
      where: { id: id },
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
        price: price !== undefined ? parseFloat(price) : null,
        payment_required: payment_required !== undefined ? (payment_required === true || payment_required === 'true') : undefined,
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
      where: { id: id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting event', error });
  }
};

export const registerForEvent = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const event = await prisma.event.findUnique({
      where: { id: id },
      include: {
        _count: {
          select: { attendees: true },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.payment_required) {
      return res.status(400).json({ message: 'This event requires payment. Please use the payment registration flow.' });
    }

    if (event.capacity && event._count.attendees >= event.capacity) {
      return res.status(400).json({ message: 'Event capacity has been reached.' });
    }

    // Check if already registered
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { attendedEventsIds: true }
    });

    if (user?.attendedEventsIds.includes(id)) {
      return res.status(400).json({ message: 'You are already registered for this event.' });
    }

    // Add user to event attendees and event to user's attended events
    await prisma.$transaction([
      prisma.event.update({
        where: { id: id },
        data: {
          attendeesIds: {
            push: userId
          }
        }
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          attendedEventsIds: {
            push: id
          }
        }
      })
    ]);

    res.status(200).json({ message: 'Successfully registered for event' });
  } catch (error) {
    console.error('Event Registration Error:', error);
    res.status(500).json({ message: 'Error registering for event', error });
  }
};
