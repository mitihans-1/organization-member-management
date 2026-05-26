import { Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const listApprovedEndorsements = async (_req: any, res: Response) => {
  try {
    const endorsements = await prisma.organizationEndorsement.findMany({
      where: { status: 'approved' },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    res.status(200).json(endorsements);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching endorsements', error });
  }
};

export const submitEndorsement = async (req: any, res: Response) => {
  try {
    if (req.user?.role !== 'orgAdmin') {
      return res.status(403).json({ message: 'Only organization admins can submit endorsements.' });
    }

    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ message: 'Message is required.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { organizationId: true, organization_name: true },
    });

    if (!user?.organizationId) {
      return res.status(400).json({ message: 'Your account is not linked to an organization.' });
    }

    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { id: true, name: true },
    });

    if (!org) return res.status(404).json({ message: 'Organization not found.' });

    const created = await prisma.organizationEndorsement.create({
      data: {
        organizationId: org.id,
        organizationName: org.name,
        message: message.trim(),
        status: 'pending',
        submittedById: req.user.userId,
      },
    });

    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: 'Error submitting endorsement', error });
  }
};

export const listAllEndorsements = async (req: any, res: Response) => {
  try {
    if (req.user?.role !== 'SuperAdmin') {
      return res.status(403).json({ message: 'SuperAdmin only' });
    }
    const endorsements = await prisma.organizationEndorsement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    res.status(200).json(endorsements);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching endorsements', error });
  }
};

export const setEndorsementStatus = async (req: any, res: Response) => {
  try {
    if (req.user?.role !== 'SuperAdmin') {
      return res.status(403).json({ message: 'SuperAdmin only' });
    }
    const { id } = req.params;
    const { status } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const updated = await prisma.organizationEndorsement.update({
      where: { id },
      data: { status },
    });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating endorsement', error });
  }
};

export const deleteEndorsement = async (req: any, res: Response) => {
  try {
    if (req.user?.role !== 'SuperAdmin') {
      return res.status(403).json({ message: 'SuperAdmin only' });
    }
    const { id } = req.params;
    await prisma.organizationEndorsement.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting endorsement', error });
  }
};

