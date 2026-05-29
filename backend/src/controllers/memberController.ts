import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { sendOtpEmail } from '../services/emailService';

const prisma = new PrismaClient();

// Helper to generate 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

export const getMembers = async (req: any, res: Response) => {
  try {
    const orgName = req.user.role === 'SuperAdmin' ? undefined : (await prisma.user.findUnique({ where: { id: req.user.userId } }))?.organization_name;
    
    const whereClause: any = { role: 'member' };
    if (orgName) {
      whereClause.organization_name = orgName;
    }

    const members = await prisma.user.findMany({
      where: whereClause,
      include: { 
        plan: true,
        customAttributeValues: {
          include: { attribute: true }
        }
      }
    });
    res.status(200).json(members);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching members', error });
  }
};

export const createMember = async (req: any, res: Response) => {
  try {
    const { name, email, password, phone, address, sex, join_date, organizationId } = req.body;
    const admin = await prisma.user.findUnique({ 
      where: { id: req.user.userId },
      include: { plan: true }
    });

    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    let targetOrgId: string | undefined;
    let targetOrgName: string | undefined;
    let targetOrgType: string | undefined;

    if (admin.role === 'SuperAdmin') {
      if (!organizationId) {
        return res.status(400).json({ message: 'Organization is required for SuperAdmin' });
      }
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId }
      });
      if (!organization) {
        return res.status(404).json({ message: 'Organization not found' });
      }
      targetOrgId = organization.id;
      targetOrgName = organization.name;
      targetOrgType = organization.type;
    } else {
      targetOrgId = admin.organizationId ?? undefined;
      targetOrgName = admin.organization_name ?? undefined;
      targetOrgType = admin.organization_type ?? undefined;
      
      // Check plan limits only for OrgAdmins
      const currentMembers = await prisma.user.count({
        where: { organization_name: targetOrgName, role: 'member' }
      });

      if (admin.plan && currentMembers >= admin.plan.max_members) {
        return res.status(400).json({ message: 'Member limit reached for your plan' });
      }
    }

    const hashedPassword = await bcrypt.hash(password || 'password123', 10);

    // Generate OTP
    const otpCode = generateOtp();
    const hashedOtp = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + 10 * 60000);

    // Create pending user
    await prisma.pendingUser.upsert({
      where: { email },
      update: {
        name,
        password: hashedPassword,
        role: 'member',
        organization_name: targetOrgName,
        organization_type: targetOrgType,
        organization_id: targetOrgId,
        phone,
        address,
        sex,
        join_date: join_date ? new Date(join_date) : new Date(),
        otp_code: hashedOtp,
        expiresAt,
      },
      create: {
        name,
        email,
        password: hashedPassword,
        role: 'member',
        organization_name: targetOrgName,
        organization_type: targetOrgType,
        organization_id: targetOrgId,
        phone,
        address,
        sex,
        join_date: join_date ? new Date(join_date) : new Date(),
        otp_code: hashedOtp,
        expiresAt,
      },
    });

    // Send OTP email
    try {
      await sendOtpEmail(email, otpCode, name);
    } catch (emailError) {
      console.error('Failed to send OTP email to new member:', emailError);
    }

    res.status(201).json({ message: 'Member created successfully. OTP sent to email.' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating member', error });
  }
};

export const updateMember = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, sex, join_date, status } = req.body;
    
    // In a real app we'd verify the admin owns this member
    const member = await prisma.user.update({
      where: { id: id },
      data: {
        name,
        email,
        phone,
        address,
        sex,
        join_date: join_date ? new Date(join_date) : undefined,
      },
    });
    res.status(200).json(member);
  } catch (error) {
    res.status(500).json({ message: 'Error updating member', error });
  }
};

export const deleteMember = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    
    // First delete all related records to maintain database integrity
    await prisma.memberAttributeValue.deleteMany({ where: { memberId: id } });
    await prisma.notification.deleteMany({ where: { userId: id } });
    await prisma.otpToken.deleteMany({ where: { userId: id } });
    await prisma.member.deleteMany({ where: { user_id: id } });
    
    // Clean up IdCard and dependent Print Logs
    const idCards = await prisma.idCard.findMany({ where: { userId: id } });
    const idCardIds = idCards.map(c => c.id);
    if (idCardIds.length > 0) {
      await prisma.idCardPrintLog.deleteMany({ where: { idCardId: { in: idCardIds } } });
    }
    await prisma.idCard.deleteMany({ where: { userId: id } });
    await prisma.idCardRequest.deleteMany({ where: { userId: id } });
    await prisma.idCardVerificationLog.deleteMany({ where: { memberId: id } });
    
    await prisma.report.deleteMany({ where: { memberId: id } });
    await prisma.eventMessage.deleteMany({ where: { senderId: id } });
    await prisma.emailNotificationLog.deleteMany({ where: { userId: id } });
    
    // Chat messages and conversations
    await prisma.message.deleteMany({ where: { senderId: id } });
    await prisma.conversation.deleteMany({
      where: {
        OR: [
          { participant1Id: id },
          { participant2Id: id }
        ]
      }
    });

    // Event participants and attendance logs
    await prisma.eventParticipant.deleteMany({ where: { userId: id } });
    await prisma.eventAttendance.deleteMany({ where: { userId: id } });

    // Service feedbacks and activity history
    await prisma.serviceFeedback.deleteMany({ where: { userId: id } });
    await prisma.activityHistory.deleteMany({ where: { userId: id } });
    await prisma.notificationCenter.deleteMany({ where: { userId: id } });

    // Delete blogs authored by this member
    await prisma.blog.deleteMany({ where: { author_id: id } });

    // Service requests and approval workflows
    const requests = await prisma.serviceRequest.findMany({ where: { userId: id } });
    const requestIds = requests.map(req => req.id);
    if (requestIds.length > 0) {
      await prisma.serviceRequestAttachment.deleteMany({ where: { requestId: { in: requestIds } } });
      await prisma.serviceInternalNote.deleteMany({ where: { requestId: { in: requestIds } } });
      await prisma.serviceApproval.deleteMany({ where: { requestId: { in: requestIds } } });
      await prisma.serviceApprovalAuditLog.deleteMany({ where: { requestId: { in: requestIds } } });
      await prisma.serviceRequest.deleteMany({ where: { userId: id } });
    }

    // Invoices and sub-tables
    const invoices = await prisma.invoice.findMany({ where: { memberId: id } });
    const invoiceIds = invoices.map(inv => inv.id);
    if (invoiceIds.length > 0) {
      await prisma.invoiceItem.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
      await prisma.invoicePayment.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
      await prisma.invoiceReminder.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
      await prisma.invoice.deleteMany({ where: { memberId: id } });
    }

    // Member subscriptions and payments
    const subs = await prisma.memberSubscription.findMany({ where: { memberId: id } });
    const subIds = subs.map(s => s.id);
    if (subIds.length > 0) {
      await prisma.memberSubscriptionPayment.deleteMany({ where: { subscriptionId: { in: subIds } } });
      await prisma.memberSubscription.deleteMany({ where: { memberId: id } });
    }

    // Payments made by the user
    const userPayments = await prisma.payment.findMany({ where: { user_id: id } });
    const paymentIds = userPayments.map(p => p.id);
    if (paymentIds.length > 0) {
      await prisma.invoicePayment.deleteMany({ where: { paymentId: { in: paymentIds } } });
      await prisma.memberSubscriptionPayment.deleteMany({ where: { paymentId: { in: paymentIds } } });
      await prisma.payment.deleteMany({ where: { user_id: id } });
    }
    
    // Remove user ID from event attendeesIds arrays (filtered in-memory since MongoDB/Prisma does not support pull in updateMany)
    const eventsToUpdate = await prisma.event.findMany({
      where: { attendeesIds: { has: id } }
    });
    for (const event of eventsToUpdate) {
      await prisma.event.update({
        where: { id: event.id },
        data: {
          attendeesIds: event.attendeesIds.filter(attendeeId => attendeeId !== id)
        }
      });
    }
    
    // Remove user ID from service subscribersIds arrays (filtered in-memory)
    const servicesToUpdate = await prisma.service.findMany({
      where: { subscribersIds: { has: id } }
    });
    for (const service of servicesToUpdate) {
      await prisma.service.update({
        where: { id: service.id },
        data: {
          subscribersIds: service.subscribersIds.filter(subId => subId !== id)
        }
      });
    }
    
    // Now delete the user
    await prisma.user.delete({
      where: { id: id },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting member:', error);
    res.status(500).json({ message: 'Error deleting member', error });
  }
};
