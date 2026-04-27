import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getBlogs = async (req: Request, res: Response) => {
  try {
    const blogs = await prisma.blog.findMany({
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
    const { title, content, image, status, category, tags, readTime } = req.body;
    const finalImage = req.file ? req.file.path : image;
    const blog = await prisma.blog.create({
      data: {
        title,
        content,
        image: finalImage,
        status: status || 'draft',
        category: category || 'general',
        tags: tags || null,
        readTime: readTime ? parseInt(readTime) : null,
        author_id: req.user.userId,
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
    const { title, content, status, category, tags, readTime } = req.body;
    const image = req.file ? req.file.path : req.body.image;

    const existingBlog = await prisma.blog.findUnique({
      where: { id: id }
    });
    
    if (!existingBlog) {
      return res.status(404).json({ message: 'Blog not found' });
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
