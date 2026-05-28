import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const listNotifications = async (req: any, res: Response) => {
  try {
    console.log('Fetching notifications for user:', req.user);
    
    const rows = await prisma.notification.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    console.log('Found notifications:', rows);

    res.status(200).json(
      rows.map((n) => ({
        id: n.id,
        title: n.title,
        read: n.read,
        link: n.link,
        createdAt: n.createdAt.toISOString(),
      })),
    );
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications', error });
  }
};

export const createTestNotification = async (req: any, res: Response) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: req.user.userId,
        title: req.body.title || 'Test Notification',
        link: req.body.link,
      },
    });

    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating test notification:', error);
    res.status(500).json({ message: 'Error creating test notification', error });
  }
};

export const markNotificationRead = async (req: any, res: Response) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const existing = await prisma.notification.findFirst({
      where: { id, userId: req.user.userId },
    });
    if (!existing) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error updating notification', error });
  }
};

export const markAllNotificationsRead = async (req: any, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.userId, read: false },
      data: { read: true },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error updating notifications', error });
  }
};
