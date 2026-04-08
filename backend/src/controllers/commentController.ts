import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getComments = async (req: Request, res: Response) => {
  try {
    const { blogId } = req.params;
    const comments = await prisma.blogComment.findMany({
      where: { blog_id: parseInt(blogId) },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching comments', error });
  }
};

export const postComment = async (req: Request, res: Response) => {
  try {
    const { blogId } = req.params;
    const { author, content } = req.body;

    if (!author || !content) {
      return res.status(400).json({ message: 'Author and content are required' });
    }

    const comment = await prisma.blogComment.create({
      data: {
        blog_id: parseInt(blogId),
        author,
        content,
      },
    });

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Error posting comment', error });
  }
};
