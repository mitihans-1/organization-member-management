import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { resolveCatalogWhere, resolveRequestContext } from '../utils/catalogScope';
import {
  attachBlogAuthors,
  createPlatformBlog,
  deletePlatformBlog,
  filterPlatformBlogsForBrowse,
  getPlatformBlogById,
  listPlatformBlogs,
  shouldMergePlatformCatalog,
  updatePlatformBlog,
} from '../data/predefinedCatalogStore';

const prisma = new PrismaClient();

export const getBlogs = async (req: any, res: Response) => {
  try {
    const ctx = await resolveRequestContext(req);
    const mode = req.query.mode === 'dashboard' ? 'browse_dashboard' : 'browse_navbar';
    const where = await resolveCatalogWhere(req, mode);
    const publishedOnly = ctx.role === 'guest' || ctx.role === 'member';

    const dbBlogs = await prisma.blog.findMany({
      where: {
        ...where,
        ...(publishedOnly && { status: 'published' }),
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    let blogs: any[] = dbBlogs;
    if (shouldMergePlatformCatalog(mode)) {
      const platform = filterPlatformBlogsForBrowse(listPlatformBlogs(), publishedOnly);
      const withAuthors = await attachBlogAuthors(platform);
      blogs = [...withAuthors, ...dbBlogs].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }

    res.status(200).json(blogs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blogs', error });
  }
};

export const createBlog = async (req: any, res: Response) => {
  try {
    const { title, content, image, status, category, tags, readTime, isPredefined, visibility } =
      req.body;
    const finalImage = req.file ? req.file.path : image;

    let orgId = req.user?.organizationId;
    if (!orgId && req.user?.userId) {
      const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
      orgId = user?.organizationId;
    }

    const predefined =
      req.user?.role === 'SuperAdmin' &&
      (isPredefined === true || isPredefined === 'true');

    if (predefined) {
      const blog = createPlatformBlog({
        title,
        content,
        image: finalImage ?? null,
        status: status || 'published',
        visibility: visibility || 'public',
        category: category || 'general',
        tags: tags || null,
        readTime: readTime ? parseInt(readTime, 10) : null,
        author_id: req.user.userId,
      });
      const [withAuthor] = await attachBlogAuthors([blog]);
      return res.status(201).json(withAuthor);
    }

    const blog = await prisma.blog.create({
      data: {
        title,
        content,
        image: finalImage,
        status: status || 'draft',
        visibility: visibility || 'public',
        category: category || 'general',
        tags: tags || null,
        readTime: readTime ? parseInt(readTime, 10) : null,
        author_id: req.user.userId,
        organizationId: orgId || null,
        isPredefined: false,
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

    const platform = getPlatformBlogById(id);
    if (platform) {
      if (req.user.role !== 'SuperAdmin') {
        return res.status(403).json({
          message: 'Platform predefined blogs can only be edited by SuperAdmin.',
        });
      }
      const updated = updatePlatformBlog(id, {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(image !== undefined && { image }),
        ...(status !== undefined && { status }),
        ...(visibility !== undefined && { visibility }),
        ...(category !== undefined && { category }),
        ...(tags !== undefined && { tags }),
        ...(readTime !== undefined && { readTime: readTime !== null ? parseInt(readTime, 10) : null }),
      });
      if (!updated) return res.status(404).json({ message: 'Blog not found' });
      const [withAuthor] = await attachBlogAuthors([updated]);
      return res.status(200).json(withAuthor);
    }

    const existingBlog = await prisma.blog.findUnique({ where: { id } });
    if (!existingBlog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    if (existingBlog.author_id !== req.user.userId && req.user.role !== 'SuperAdmin' && req.user.role !== 'orgAdmin') {
      return res.status(403).json({ message: 'Not authorized to update this blog' });
    }

    const blog = await prisma.blog.update({
      where: { id },
      data: {
        title,
        content,
        image,
        status: status ?? 'draft',
        visibility: visibility !== undefined ? visibility : undefined,
        category: category ?? 'general',
        tags: tags !== undefined ? tags : null,
        readTime: readTime !== undefined ? parseInt(readTime, 10) : null,
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

    if (getPlatformBlogById(id)) {
      if (req.user.role !== 'SuperAdmin') {
        return res.status(403).json({
          message: 'Platform predefined blogs can only be deleted by SuperAdmin.',
        });
      }
      if (!deletePlatformBlog(id)) {
        return res.status(404).json({ message: 'Blog not found' });
      }
      return res.status(204).send();
    }

    const existingBlog = await prisma.blog.findUnique({ where: { id } });
    if (!existingBlog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    if (existingBlog.author_id !== req.user.userId && req.user.role !== 'SuperAdmin' && req.user.role !== 'orgAdmin') {
      return res.status(403).json({ message: 'Not authorized to delete this blog' });
    }

    await prisma.blog.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting blog', error });
  }
};
