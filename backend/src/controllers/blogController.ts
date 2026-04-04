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
    const { title, content, image, status, category } = req.body;
    const blog = await prisma.blog.create({
      data: {
        title,
        content,
        image,
        status: status || 'draft',
        category: category || 'general',
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
    const { title, content, image, status, category } = req.body;
    const blog = await prisma.blog.update({
      where: { id: parseInt(id), author_id: req.user.userId },
      data: {
        title,
        content,
        image,
        status: status ?? 'draft',
        category: category ?? 'general',
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
    await prisma.blog.delete({
      where: { id: parseInt(id), author_id: req.user.userId },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting blog', error });
  }
};
