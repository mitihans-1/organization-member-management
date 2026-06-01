import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { resolveCatalogWhere, resolveRequestContext } from '../utils/catalogScope';

const prisma = new PrismaClient();

export const getBlogs = async (req: any, res: Response) => {
  try {
    const ctx = await resolveRequestContext(req);
    const where = await resolveCatalogWhere(req);
    const publishedOnly = ctx.role === 'guest' || ctx.role === 'member';
    const isPublicOnly = ctx.role === 'guest';
    const blogs = await prisma.blog.findMany({
      where: {
        ...where,
        ...(publishedOnly && { status: 'published' }),
        ...(isPublicOnly && { visibility: 'public' })
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(blogs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blogs', error });
  }
};

export const createBlog = async (req: any, res: Response) => {
  try {
    const { title, content, image, status, category, tags, readTime, isPredefined, visibility } = req.body;
    const finalImage = req.file ? req.file.path : image;

    let orgId = req.user?.organizationId;
    if (!orgId && req.user?.userId) {
      const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
      orgId = user?.organizationId;
    }

    const predefined =
      req.user?.role === 'SuperAdmin' &&
      (isPredefined === true || isPredefined === 'true');

    const blog = await prisma.blog.create({
      data: {
        title,
        content,
        image: finalImage,
        status: status || 'draft',
        visibility: visibility || 'public',
        category: category || 'general',
        tags: tags || null,
        readTime: readTime ? parseInt(readTime) : null,
        author_id: req.user.userId,
        organizationId: predefined ? null : orgId || null,
        isPredefined: predefined,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });
    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Error creating blog', error });
  }
};

export const updateBlog = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, status, category, tags, readTime, visibility } = req.body;
    const image = req.file ? req.file.path : req.body.image;

    const existingBlog = await prisma.blog.findUnique({
      where: { id: id }
    });
    
    if (!existingBlog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Platform predefined blogs are fully controlled by SuperAdmin
    if ((existingBlog as any).isPredefined && req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ message: 'Platform predefined blogs can only be edited by SuperAdmin.' });
    }
    
    if (existingBlog.author_id !== req.user.userId && req.user.role !== 'SuperAdmin' && req.user.role !== 'orgAdmin') {
      return res.status(403).json({ message: 'Not authorized to update this blog' });
    }

    const blog = await prisma.blog.update({
      where: { id: id },
      data: {
        title,
        content,
        image,
        status: status ?? 'draft',
        visibility: visibility !== undefined ? visibility : undefined,
        category: category ?? 'general',
        tags: tags !== undefined ? tags : null,
        readTime: readTime !== undefined ? parseInt(readTime) : null,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });
    res.status(200).json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Error updating blog', error });
  }
};

export const deleteBlog = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    const existingBlog = await prisma.blog.findUnique({
      where: { id: id }
    });
    
    if (!existingBlog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Platform predefined blogs are fully controlled by SuperAdmin
    if ((existingBlog as any).isPredefined && req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ message: 'Platform predefined blogs can only be deleted by SuperAdmin.' });
    }
    
    if (existingBlog.author_id !== req.user.userId && req.user.role !== 'SuperAdmin' && req.user.role !== 'orgAdmin') {
      return res.status(403).json({ message: 'Not authorized to delete this blog' });
    }

    await prisma.blog.delete({
      where: { id: id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting blog', error });
  }
};
