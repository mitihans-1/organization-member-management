import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export const getChatableUsers = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    const userOrganizationId = (req as any).user.organizationId;

    let users;

    if (userRole === 'member') {
      users = await prisma.user.findMany({
        where: {
          role: 'orgAdmin',
          organizationId: userOrganizationId
        },
        select: { id: true, name: true, email: true, profile_photo_path: true }
      });
    } else if (userRole === 'orgAdmin') {
      const members = await prisma.user.findMany({
        where: {
          role: 'member',
          organizationId: userOrganizationId
        },
        select: { id: true, name: true, email: true, profile_photo_path: true }
      });
      const superAdmins = await prisma.user.findMany({
        where: { role: 'SuperAdmin' },
        select: { id: true, name: true, email: true, profile_photo_path: true }
      });
      users = [...members, ...superAdmins];
    } else {
      const orgAdmins = await prisma.user.findMany({
        where: { role: 'orgAdmin' },
        select: { id: true, name: true, email: true, profile_photo_path: true, organization_name: true }
      });
      const members = await prisma.user.findMany({
        where: { role: 'member' },
        select: { id: true, name: true, email: true, profile_photo_path: true, organization_name: true }
      });
      users = [...orgAdmins, ...members];
    }

    res.json(users);
  } catch (error) {
    console.error('Error fetching chatable users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

export const getConversations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participant1Id: userId },
          { participant2Id: userId }
        ]
      },
      include: {
        participant1: { select: { id: true, name: true, email: true, profile_photo_path: true } },
        participant2: { select: { id: true, name: true, email: true, profile_photo_path: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { select: { id: true, name: true } } }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const userId = (req as any).user.userId;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: { select: { id: true, name: true, profile_photo_path: true } } }
        },
        participant1: { select: { id: true, name: true, email: true, profile_photo_path: true } },
        participant2: { select: { id: true, name: true, email: true, profile_photo_path: true } }
      }
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    res.json(conversation);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { content, attachmentUrl, attachmentType } = req.body;
    const senderId = (req as any).user.userId;

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        content,
        attachmentUrl,
        attachmentType
      },
      include: {
        sender: { select: { id: true, name: true, profile_photo_path: true } }
      }
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

export const createConversation = async (req: Request, res: Response) => {
  try {
    const { participant2Id, type, organizationId } = req.body;
    const participant1Id = (req as any).user.userId;

    let existingConversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { participant1Id, participant2Id },
          { participant1Id: participant2Id, participant2Id: participant1Id }
        ],
        type
      },
      include: {
        participant1: { select: { id: true, name: true, email: true, profile_photo_path: true } },
        participant2: { select: { id: true, name: true, email: true, profile_photo_path: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { select: { id: true, name: true } } }
        }
      }
    });

    if (existingConversation) {
      return res.json(existingConversation);
    }

    const conversation = await prisma.conversation.create({
      data: {
        type,
        participant1Id,
        participant2Id,
        organizationId
      },
      include: {
        participant1: { select: { id: true, name: true, email: true, profile_photo_path: true } },
        participant2: { select: { id: true, name: true, email: true, profile_photo_path: true } },
        messages: true
      }
    });

    res.status(201).json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ message: 'Failed to create conversation' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const userId = (req as any).user.userId;

    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Failed to mark messages as read' });
  }
};
