import { Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function requireSuperAdmin(req: any, res: Response) {
  if (req.user?.role !== 'SuperAdmin') {
    res.status(403).json({ message: 'Super Admin only' });
    return false;
  }
  return true;
}

export const getPlatformServices = async (req: any, res: Response) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const services = await prisma.service.findMany({
      where: { isPredefined: true },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(services);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deletePlatformService = async (req: any, res: Response) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const { id } = req.params;
    const item = await prisma.service.findFirst({ where: { id, isPredefined: true } });
    if (!item) return res.status(404).json({ message: 'Platform service not found' });
    await prisma.service.delete({ where: { id } });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPlatformEvents = async (req: any, res: Response) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const events = await prisma.event.findMany({
      where: { isPredefined: true },
      orderBy: { date: 'asc' },
    });
    res.status(200).json(events);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deletePlatformEvent = async (req: any, res: Response) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const { id } = req.params;
    const item = await prisma.event.findFirst({ where: { id, isPredefined: true } });
    if (!item) return res.status(404).json({ message: 'Platform event not found' });
    await prisma.event.delete({ where: { id } });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPlatformBlogs = async (req: any, res: Response) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const blogs = await prisma.blog.findMany({
      where: { isPredefined: true },
      include: { author: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(blogs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deletePlatformBlog = async (req: any, res: Response) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const { id } = req.params;
    const item = await prisma.blog.findFirst({ where: { id, isPredefined: true } });
    if (!item) return res.status(404).json({ message: 'Platform blog not found' });
    await prisma.blog.delete({ where: { id } });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const clearPlatformAbout = async (req: any, res: Response) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const model = (prisma as any).systemConfig;
    const config = await model.findFirst();
    if (!config) return res.status(404).json({ message: 'No config' });
    const updated = await model.update({
      where: { id: config.id },
      data: {
        aboutTitle: null,
        aboutSubtitle: null,
        aboutMission: null,
        aboutStory: null,
        aboutStatsJson: null,
        aboutTimelineJson: null,
      },
    });
    res.status(200).json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
