import { Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function requireNotificationAccess(req: any, res: Response): boolean {
  const role = req.user?.role;
  if (role !== 'orgAdmin' && role !== 'SuperAdmin') {
    res.status(403).json({ message: 'Organization admin or super admin only' });
    return false;
  }
  return true;
}

export const listNotifications = async (req: any, res: Response) => {
  try {
    if (!requireNotificationAccess(req, res)) return;

    const rows = await prisma.notification.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.status(200).json(
      rows.map((n) => ({
        id: n.id,
        title: n.title,
        read: n.read,
        createdAt: n.createdAt.toISOString(),
      })),
    );
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error });
  }
};

export const markNotificationRead = async (req: any, res: Response) => {
  try {
    if (!requireNotificationAccess(req, res)) return;

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
    if (!requireNotificationAccess(req, res)) return;

    await prisma.notification.updateMany({
      where: { userId: req.user.userId, read: false },
      data: { read: true },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error updating notifications', error });
  }
};
