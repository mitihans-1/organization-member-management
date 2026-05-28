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
    await prisma.user.delete({
      where: { id: id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting member', error });
  }
};
