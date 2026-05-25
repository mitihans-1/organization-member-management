import { Request, Response } from 'express';
// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

export const getEventMessages = async (req: any, res: Response) => {
  try {
    // const { eventId } = req.params;
    
    // const messages = await prisma.eventMessage.findMany({
    //   where: { eventId },
    //   include: {
    //     sender: { select: { id: true, name: true, profile_photo_path: true } },
    //     replyTo: {
    //       include: {
    //         sender: { select: { id: true, name: true } }
    //       }
    //     }
    //   },
    //   orderBy: { createdAt: 'asc' },
    //   take: 100
    // });

    res.status(200).json([]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching event messages', error });
  }
};

export const createEventMessage = async (req: any, res: Response) => {
  try {
    // const { eventId } = req.params;
    // const { content, attachmentUrl, attachmentType, replyToId } = req.body;
    // const senderId = req.user.userId;
    
    // const message = await prisma.eventMessage.create({
    //   data: {
    //     eventId,
    //     senderId,
    //     content,
    //     attachmentUrl,
    //     attachmentType,
    //     replyToId
    //   },
    //   include: {
    //     sender: { select: { id: true, name: true, profile_photo_path: true } },
    //     replyTo: {
    //       include: {
    //         sender: { select: { id: true, name: true } }
    //       }
    //     }
    //   }
    // });

    res.status(201).json({});
  } catch (error) {
    res.status(500).json({ message: 'Error creating event message', error });
  }
};
