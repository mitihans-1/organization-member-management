import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

export const register = async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      password,
      role: roleRaw,
      organization_name,
      organization_type,
      organization_id,
    } = req.body;

    const role =
      roleRaw === 'member'
        ? 'member'
        : roleRaw === 'orgAdmin' || roleRaw === 'organAdmin'
          ? 'orgAdmin'
          : null;
          
    if (!role || roleRaw === 'SuperAdmin') {
      return res.status(400).json({ message: 'Invalid role. Register as Organization Admin or Member only.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let user;

    if (role === 'orgAdmin') {
      if (!organization_name?.trim() || !organization_type?.trim()) {
        return res.status(400).json({ message: 'Organization name and type are required' });
      }
      const org = await prisma.organization.create({
        data: {
          name: organization_name.trim(),
          type: organization_type.trim(),
        },
      });
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'orgAdmin',
          organizationId: org.id,
          organization_name: org.name,
          organization_type: org.type,
        },
      });
    } else {
      const orgId = organization_id as string | undefined;
      if (!orgId?.trim()) {
        return res.status(400).json({ message: 'Please select an organization' });
      }
      const org = await prisma.organization.findUnique({ where: { id: orgId.trim() } });
      if (!org) {
        return res.status(400).json({ message: 'Organization not found' });
      }
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'member',
          organizationId: org.id,
          organization_name: org.name,
          organization_type: org.type,
        },
      });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error: any) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error: any) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

export const getProfile = async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { plan: true },
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const { password, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  } catch (error: any) {
    console.error('Fetch Profile Error:', error);
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

export const updateProfile = async (req: any, res: Response) => {
  try {
    const { name, email, phone, address, organization_name, organization_type, sex, join_date } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        name,
        email,
        phone,
        address,
        organization_name,
        organization_type,
        sex,
        join_date: join_date ? new Date(join_date) : undefined,
      },
    });
    const { password, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  } catch (error: any) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const token = Math.random().toString(36).substr(2, 10);
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    await prisma.passwordResetToken.upsert({
      where: { email },
      update: { token, expiresAt },
      create: { email, token, expiresAt },
    });

    // Mock email sending
    console.log(`Password reset token for ${email}: ${token}`);

    res.status(200).json({ message: 'Password reset link sent to your email' });
  } catch (error: any) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ message: 'Error in forgot password', error: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, token, password } = req.body;

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { email },
    });

    if (!resetToken || resetToken.token !== token || resetToken.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    await prisma.passwordResetToken.delete({ where: { email } });

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error: any) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ message: 'Error in reset password', error: error.message });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) return res.status(400).json({ message: 'Invalid google token payload' });

    const user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user) {
      return res.status(404).json({ message: 'User not registered. Please sign up first.' });
    }

    const jwtToken = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.status(200).json({ token: jwtToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error: any) {
    console.error('Google Login Error:', error);
    res.status(500).json({ message: 'Error verifying Google authentication', error: error.message });
  }
};

export const googleRegister = async (req: Request, res: Response) => {
  try {
    const {
      token,
      role: roleRaw,
      organization_name,
      organization_type,
      organization_id,
    } = req.body;

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) return res.status(400).json({ message: 'Invalid google token payload' });

    const email = payload.email;
    const name = payload.name || 'Google User';

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const role =
      roleRaw === 'member' ? 'member' : roleRaw === 'orgAdmin' || roleRaw === 'organAdmin' ? 'orgAdmin' : null;
    if (!role || roleRaw === 'SuperAdmin') {
      return res.status(400).json({ message: 'Invalid role. Register as Organization Admin or Member.' });
    }

    const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    let user;

    if (role === 'orgAdmin') {
      if (!organization_name?.trim() || !organization_type?.trim()) {
        return res.status(400).json({ message: 'Organization name and type are required' });
      }
      const org = await prisma.organization.create({
        data: { name: organization_name.trim(), type: organization_type.trim() },
      });
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          google_id: payload.sub,
          role: 'orgAdmin',
          organizationId: org.id,
          organization_name: org.name,
          organization_type: org.type,
        },
      });
    } else {
      const orgId = organization_id as string | undefined;
      if (!orgId?.trim()) {
        return res.status(400).json({ message: 'Please select an organization' });
      }
      const org = await prisma.organization.findUnique({ where: { id: orgId.trim() } });
      if (!org) {
        return res.status(400).json({ message: 'Organization not found' });
      }
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          google_id: payload.sub,
          role: 'member',
          organizationId: org.id,
          organization_name: org.name,
          organization_type: org.type,
        },
      });
    }

    const jwtToken = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({
      token: jwtToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error: any) {
    console.error('Google Registration Error:', error);
    res.status(500).json({ message: 'Error registering via Google', error: error.message });
  }
};