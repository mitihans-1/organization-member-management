import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { submitContactMessage } from './contactMessageController';

const prisma = new PrismaClient();

async function getOrCreateSystemConfig() {
  const model = (prisma as any).systemConfig;
  let config = await model.findFirst();
  if (!config) {
    config = await model.create({
      data: {
        platformName: 'OMMS',
        supportEmail: 'support@omms.com',
        contactPhone: '+251 911 234 567',
        contactAddress: 'Addis Ababa, Ethiopia',
        contactEmail: 'info@omms.com',
        contactHours: 'Mon - Fri: 8:00 AM - 5:00 PM',
        aboutTitle: 'Our Mission is to Empower Your Community',
        aboutSubtitle:
          'We help organization admins focus on building community rather than managing spreadsheets.',
      },
    });
  }
  return config;
}

function parseJsonArray<T>(raw: string | null | undefined, fallback: T[]): T[] {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export const getPlatformContent = async (_req: Request, res: Response) => {
  try {
    const config = await getOrCreateSystemConfig();
    
    // Count actual database records
    const orgCount = await prisma.organization.count();
    const memberCount = await prisma.user.count({ where: { role: 'member' } });
    const eventCount = await prisma.event.count();
    
    res.status(200).json({
      scope: 'platform',
      platformName: config.platformName,
      about: {
        title: config.aboutTitle || 'Our Mission is to Empower Your Community',
        subtitle: config.aboutSubtitle || '',
        mission: config.aboutMission || '',
        story: config.aboutStory || '',
        stats: parseJsonArray(config.aboutStatsJson, [
          { label: 'Organizations', value: orgCount.toString() },
          { label: 'Active Members', value: memberCount.toString() },
          { label: 'Events', value: eventCount.toString() },
        ]),
        timeline: parseJsonArray(config.aboutTimelineJson, []),
      },
      contact: {
        email: config.contactEmail || config.supportEmail,
        phone: config.contactPhone,
        address: config.contactAddress,
        hours: config.contactHours,
        showLiveChat: config.showLiveChat,
        liveChatUrl: config.liveChatUrl,
        facebookUrl: config.facebookUrl,
        telegramUrl: config.telegramUrl,
        linkedinUrl: config.linkedinUrl,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error loading platform content', error: error.message });
  }
};

/** @deprecated Use submitContactMessage from contactMessageController */
export const submitPlatformContact = async (req: any, res: Response) => {
  return submitContactMessage(req, res);
};

export const getOrganizationContent = async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { organizationId: true, role: true },
    });

    if (!user?.organizationId) {
      return res.status(404).json({ message: 'No organization linked to this account.' });
    }

    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId },
    });

    if (!org) {
      return res.status(404).json({ message: 'Organization not found.' });
    }

    res.status(200).json({
      scope: 'organization',
      organizationId: org.id,
      organizationName: org.name,
      about: {
        title: org.aboutTitle || `About ${org.name}`,
        subtitle: org.aboutSubtitle || '',
        mission: org.aboutMission || '',
        story: org.aboutStory || '',
        stats: parseJsonArray(org.aboutStatsJson, []),
        timeline: parseJsonArray(org.aboutTimelineJson, []),
      },
      contact: {
        email: org.contactEmail,
        phone: org.contactPhone,
        address: org.contactAddress,
        hours: org.contactHours,
        formRecipient: org.contactFormRecipient || org.contactEmail,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error loading organization content', error: error.message });
  }
};

export const updateOrganizationContent = async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { organizationId: true, role: true },
    });

    if (user?.role !== 'orgAdmin' || !user.organizationId) {
      return res.status(403).json({ message: 'Only organization admins can update this content.' });
    }

    const {
      aboutTitle,
      aboutSubtitle,
      aboutMission,
      aboutStory,
      aboutStatsJson,
      aboutTimelineJson,
      contactEmail,
      contactPhone,
      contactAddress,
      contactHours,
      contactFormRecipient,
    } = req.body;

    const updated = await prisma.organization.update({
      where: { id: user.organizationId },
      data: {
        aboutTitle: aboutTitle ?? undefined,
        aboutSubtitle: aboutSubtitle ?? undefined,
        aboutMission: aboutMission ?? undefined,
        aboutStory: aboutStory ?? undefined,
        aboutStatsJson: aboutStatsJson ?? undefined,
        aboutTimelineJson: aboutTimelineJson ?? undefined,
        contactEmail: contactEmail ?? undefined,
        contactPhone: contactPhone ?? undefined,
        contactAddress: contactAddress ?? undefined,
        contactHours: contactHours ?? undefined,
        contactFormRecipient: contactFormRecipient ?? undefined,
      },
    });

    res.status(200).json(updated);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating organization content', error: error.message });
  }
};

/** @deprecated Use submitContactMessage from contactMessageController */
export const submitOrganizationContact = async (req: any, res: Response) => {
  return submitContactMessage(req, res);
};
