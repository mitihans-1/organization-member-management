import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resolveUser(req: any) {
  if (!req.user?.userId) return null;
  return prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { id: true, name: true, email: true, role: true, organizationId: true },
  });
}

/**
 * Unified contact submit — routes by role:
 * - member → organization inbox (org admin)
 * - orgAdmin → platform inbox (super admin)
 * - guest / anonymous → platform inbox
 */
export const submitContactMessage = async (req: any, res: Response) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ message: 'Name, email, and message are required.' });
    }

    const dbUser = await resolveUser(req);
    const payload = {
      name: name.trim(),
      email: email.trim(),
      subject: subject?.trim() || null,
      message: message.trim(),
      senderUserId: dbUser?.id ?? null,
    };

    if (dbUser?.role === 'member') {
      if (!dbUser.organizationId) {
        return res.status(400).json({ message: 'Your account is not linked to an organization.' });
      }
      await prisma.contactMessage.create({
        data: {
          ...payload,
          scope: 'organization',
          organizationId: dbUser.organizationId,
          senderRole: 'member',
        },
      });
      return res.status(201).json({
        message: 'Your message was sent to your organization administrators.',
      });
    }

    if (dbUser?.role === 'orgAdmin') {
      await prisma.contactMessage.create({
        data: {
          ...payload,
          scope: 'platform',
          organizationId: dbUser.organizationId ?? null,
          senderRole: 'orgAdmin',
        },
      });
      return res.status(201).json({
        message: 'Your message was sent to platform support (Super Admin).',
      });
    }

    await prisma.contactMessage.create({
      data: {
        ...payload,
        scope: 'platform',
        senderRole: dbUser?.role ?? 'guest',
        organizationId: null,
      },
    });

    return res.status(201).json({ message: 'Message sent successfully.' });
  } catch (error: any) {
    console.error('submitContactMessage:', error);
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
};

/** Org admin: messages from members of their organization */
export const getOrganizationContactMessages = async (req: any, res: Response) => {
  try {
    const dbUser = await resolveUser(req);
    if (dbUser?.role !== 'orgAdmin' || !dbUser.organizationId) {
      return res.status(403).json({ message: 'Organization admin access required.' });
    }

    const messages = await prisma.contactMessage.findMany({
      where: {
        scope: 'organization',
        organizationId: dbUser.organizationId,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    res.status(200).json(messages);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
};

/** Super admin: platform messages (guests + org admins) */
export const getPlatformContactMessages = async (req: any, res: Response) => {
  try {
    const dbUser = await resolveUser(req);
    if (dbUser?.role !== 'SuperAdmin') {
      return res.status(403).json({ message: 'Super Admin access required.' });
    }

    const messages = await prisma.contactMessage.findMany({
      where: { scope: 'platform' },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const orgIds = [
      ...new Set(messages.map((m) => m.organizationId).filter(Boolean) as string[]),
    ];
    const orgs =
      orgIds.length > 0
        ? await prisma.organization.findMany({
            where: { id: { in: orgIds } },
            select: { id: true, name: true },
          })
        : [];
    const orgNameById = Object.fromEntries(orgs.map((o) => [o.id, o.name]));

    res.status(200).json(
      messages.map((m) => ({
        ...m,
        organizationName: m.organizationId ? orgNameById[m.organizationId] : null,
      }))
    );
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
};

export const markContactMessageRead = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const dbUser = await resolveUser(req);
    if (!dbUser) return res.status(401).json({ message: 'Unauthorized' });

    const msg = await prisma.contactMessage.findUnique({ where: { id } });
    if (!msg) return res.status(404).json({ message: 'Message not found.' });

    if (dbUser.role === 'orgAdmin') {
      if (
        msg.scope !== 'organization' ||
        msg.organizationId !== dbUser.organizationId
      ) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    } else if (dbUser.role === 'SuperAdmin') {
      if (msg.scope !== 'platform') {
        return res.status(403).json({ message: 'Forbidden' });
      }
    } else {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const updated = await prisma.contactMessage.update({
      where: { id },
      data: { isRead: true },
    });
    res.status(200).json(updated);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating message', error: error.message });
  }
};
