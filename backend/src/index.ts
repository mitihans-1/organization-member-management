import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/authRoutes';
import memberRoutes from './routes/memberRoutes';
import planRoutes from './routes/planRoutes';
import paymentRoutes from './routes/paymentRoutes';
import blogRoutes from './routes/blogRoutes';
import eventRoutes from './modules/events/routes/eventRoutes';
import adminRoutes from './routes/adminRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import organizationRoutes from './routes/organizationRoutes';
import notificationRoutes from './routes/notificationRoutes';
import helpRoutes from './routes/helpRoutes';
import faydaRoutes from './routes/faydaRoutes';
import customAttributeRoutes from './routes/customAttributeRoutes';
import chapaRoutes from './routes/chapaRoutes';
import idCardRoutes from './routes/idCardRoutes';
import serviceRoutes from './modules/services/routes/serviceRoutes';
import reportRoutes from './routes/reportRoutes';
import chatRoutes from './routes/chatRoutes';
import uploadRoutes from './routes/uploadRoutes';
import memberSubscriptionPlanRoutes from './routes/memberSubscriptionPlanRoutes';
import memberSubscriptionRoutes from './routes/memberSubscriptionRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import organizationSubscriptionRoutes from './routes/organizationSubscriptionRoutes';
import { PrismaClient } from '@prisma/client';
import { startCronJobs } from './services/cronService';
import publicRoutes from './routes/publicRoutes';

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

import path from 'path';

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/fayda', faydaRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/help', helpRoutes);
app.use('/api/custom-attributes', customAttributeRoutes);
app.use('/api/chapa', chapaRoutes);
app.use('/api/id-cards', idCardRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api', memberSubscriptionPlanRoutes);
app.use('/api', memberSubscriptionRoutes);
app.use('/api', invoiceRoutes);
app.use('/api/organization-subscriptions', organizationSubscriptionRoutes);
app.use('/api/public', publicRoutes);

const userSocketMap = new Map<string, string>();

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join', (userId: string) => {
    userSocketMap.set(userId, socket.id);
    console.log(`User ${userId} joined with socket ${socket.id}`);
  });

  socket.on('sendMessage', async (data) => {
    try {
      const { conversationId, senderId, content, attachmentUrl, attachmentType } = data;
      
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

      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId }
      });

      if (conversation) {
        const recipientId = conversation.participant1Id === senderId 
          ? conversation.participant2Id 
          : conversation.participant1Id;
        
        const recipientSocketId = userSocketMap.get(recipientId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('receiveMessage', message);
        }
        const senderSocketId = userSocketMap.get(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit('messageSent', message);
        }
      }
    } catch (error) {
      console.error('Error sending message via socket:', error);
    }
  });

  socket.on('typing', (data: { conversationId: string; userId: string; isTyping: boolean }) => {
    const { conversationId, userId, isTyping } = data;
    socket.to(`conversation-${conversationId}`).emit('typingIndicator', { userId, isTyping });
  });

  socket.on('joinConversation', (conversationId: string) => {
    socket.join(`conversation-${conversationId}`);
  });

  socket.on('markAsRead', async (data: { conversationId: string; userId: string }) => {
    try {
      const { conversationId, userId } = data;
      
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

      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId }
      });

      if (conversation) {
        const otherUserId = conversation.participant1Id === userId 
          ? conversation.participant2Id 
          : conversation.participant1Id;
        
        const otherUserSocketId = userSocketMap.get(otherUserId);
        if (otherUserSocketId) {
          io.to(otherUserSocketId).emit('messagesRead', { conversationId, userId });
        }
      }
    } catch (error) {
      console.error('Error marking messages as read via socket:', error);
    }
  });

  // ==========================================
  // EVENT DISCUSSION ROOMS (TEMPORARILY COMMENTED OUT - Missing EventMessage model)
  // ==========================================
  // socket.on('joinEventRoom', async (data: { eventId: string; userId: string }) => {
  //   const { eventId, userId } = data;
  //   socket.join(`event-${eventId}`);
  //   console.log(`User ${userId} joined event room ${eventId}`);
  //   
  //   io.to(`event-${eventId}`).emit('userJoinedEventRoom', { userId, socketId: socket.id });
  // });

  // socket.on('sendEventMessage', async (data: { 
  //   eventId: string; 
  //   senderId: string; 
  //   content?: string; 
  //   attachmentUrl?: string; 
  //   attachmentType?: string;
  //   replyToId?: string;
  // }) => {
  //   try {
  //     const { eventId, senderId, content, attachmentUrl, attachmentType, replyToId } = data;
  //     
  //     const message = await prisma.eventMessage.create({
  //       data: {
  //         eventId,
  //         senderId,
  //         content,
  //         attachmentUrl,
  //         attachmentType,
  //         replyToId
  //       },
  //       include: {
  //         sender: { select: { id: true, name: true, profile_photo_path: true } },
  //         replyTo: {
  //           include: {
  //             sender: { select: { id: true, name: true } }
  //           }
  //         }
  //       }
  //     });

  //     io.to(`event-${eventId}`).emit('receiveEventMessage', message);
  //   } catch (error) {
  //     console.error('Error sending event message via socket:', error);
  //   }
  // });

  // socket.on('eventTyping', (data: { eventId: string; userId: string; isTyping: boolean }) => {
  //   const { eventId, userId, isTyping } = data;
  //   socket.to(`event-${eventId}`).emit('eventTypingIndicator', { userId, isTyping });
  // });

  // socket.on('leaveEventRoom', (eventId: string) => {
  //   socket.leave(`event-${eventId}`);
  //   console.log(`User left event room ${eventId}`);
  // });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        userSocketMap.delete(userId);
        break;
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

app.get('/', (req, res) => {
  res.send('Organization Membership Management API');
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  startCronJobs();
});
