import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// ----------------------------------------------------------------------
// MEMBER ENDPOINTS
// ----------------------------------------------------------------------

export const requestIdCard = async (req: any, res: Response) => {
  try {
    const { requestType, reason, phone, sex, address } = req.body;
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user || !user.organizationId) {
      return res.status(400).json({ message: 'User or Organization not found.' });
    }

    // Check if there is already a pending request
    const existingRequest = await prisma.idCardRequest.findFirst({
      where: {
        userId,
        requestStatus: { in: ['PENDING', 'PENDING_PAYMENT_VERIFICATION'] }
      }
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending request.' });
    }

    // Update user profile with missing info if provided
    if (phone || sex || address) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(phone && { phone }),
          ...(sex && { sex }),
          ...(address && { address }),
        }
      });
    }

    // If REPLACEMENT, status starts as PENDING_PAYMENT_VERIFICATION
    const requestStatus = requestType === 'REPLACEMENT' ? 'PENDING_PAYMENT_VERIFICATION' : 'PENDING';
    const paymentStatus = requestType === 'REPLACEMENT' ? 'PENDING' : 'NOT_REQUIRED';

    const newRequest = await prisma.idCardRequest.create({
      data: {
        userId,
        organizationId: user.organizationId,
        requestType: requestType || 'FIRST_TIME',
        reason: reason || null,
        paymentStatus,
        requestStatus,
      }
    });

    // Notify organization admins
    const orgAdmins = await prisma.user.findMany({
      where: { organizationId: user.organizationId, role: 'orgAdmin' }
    });

    if (orgAdmins.length > 0) {
      await prisma.notification.createMany({
        data: orgAdmins.map(admin => ({
          userId: admin.id,
          title: `New ID Card request from ${user.name}`
        }))
      });
    }

    res.status(201).json({ message: 'Request submitted successfully.', data: newRequest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error submitting request', error });
  }
};

export const getMyIdCard = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;

    const card = await prisma.idCard.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: {
        user: {
          select: { name: true, email: true, profile_photo_path: true, role: true, join_date: true, phone: true, sex: true, address: true }
        },
        organization: {
          select: { 
            name: true,
            users: {
              where: { role: 'orgAdmin' },
              select: { profile_photo_path: true },
              take: 1
            }
          }
        }
      }
    });

    const activeRequest = await prisma.idCardRequest.findFirst({
      where: {
        userId,
        requestStatus: { in: ['PENDING', 'PENDING_PAYMENT_VERIFICATION'] }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ card, activeRequest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching ID card details.', error });
  }
};

export const logPrint = async (req: any, res: Response) => {
  try {
    const { idCardId } = req.body;
    const userId = req.user.userId;
    const role = req.user.role;

    const card = await prisma.idCard.findUnique({ where: { id: idCardId } });
    if (!card) return res.status(404).json({ message: 'Card not found' });

    // Ensure member only logs their own card
    if (role === 'member' && card.userId !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await prisma.idCardPrintLog.create({
      data: {
        idCardId,
        printedById: userId,
        printedByRole: role,
      }
    });

    await prisma.idCard.update({
      where: { id: idCardId },
      data: { printCount: { increment: 1 } }
    });

    res.status(200).json({ message: 'Print logged successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error logging print', error });
  }
};

// ----------------------------------------------------------------------
// ORG ADMIN ENDPOINTS
// ----------------------------------------------------------------------

export const getRequests = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const admin = await prisma.user.findUnique({ where: { id: userId } });
    if (!admin?.organizationId) return res.status(403).json({ message: 'No organization access' });

    const requestsRaw = await prisma.idCardRequest.findMany({
      where: { organizationId: admin.organizationId },
      orderBy: { createdAt: 'desc' }
    });

    // Manually fetch users to avoid Prisma "Inconsistent query result" error
    // if a user was deleted but their request remained in the database.
    const userIds = [...new Set(requestsRaw.map(r => r.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, phone: true, sex: true, address: true, profile_photo_path: true }
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    const requests = requestsRaw
      .map(r => ({
        ...r,
        user: userMap.get(r.userId) || null
      }))
      .filter(r => r.user !== null); // Filter out requests for deleted users

    res.status(200).json(requests);
  } catch (error) {
    console.error('getRequests error:', error);
    res.status(500).json({ message: 'Error fetching requests', error });
  }
};

export const approveRequest = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user.userId;

    const request = await prisma.idCardRequest.findUnique({ where: { id } });
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.requestType === 'REPLACEMENT' && request.paymentStatus !== 'COMPLETED') {
      return res.status(400).json({ message: 'Cannot approve replacement before payment is verified.' });
    }

    // Invalidate existing active cards
    await prisma.idCard.updateMany({
      where: { userId: request.userId, status: 'ACTIVE' },
      data: { status: 'REVOKED' }
    });

    // Find previous version to increment
    const previousCard = await prisma.idCard.findFirst({
      where: { userId: request.userId },
      orderBy: { version: 'desc' }
    });
    const newVersion = previousCard ? previousCard.version + 1 : 1;
    const { formatConfig } = req.body;
    let cardNumber = '';
    
    if (formatConfig) {
      const { prefix = '', length = 6, includeNumbers = true, includeLetters = true, includeHyphens = false, suffix = '' } = formatConfig;
      let charset = '';
      if (includeNumbers) charset += '0123456789';
      if (includeLetters) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      if (!charset) charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // Fallback
      
      let randomPart = '';
      for (let i = 0; i < length; i++) {
        randomPart += charset.charAt(Math.floor(Math.random() * charset.length));
      }

      if (includeHyphens && randomPart.length > 3) {
        // Insert a hyphen every 3-4 characters for readability
        randomPart = randomPart.match(new RegExp('.{1,4}', 'g'))?.join('-') || randomPart;
      }

      cardNumber = `${prefix}${randomPart}${suffix}`;
    } else {
      cardNumber = `ID-${Date.now().toString().slice(-6)}-${request.userId.slice(-4)}`;
    }
    
    const qrToken = crypto.randomUUID();

    const newCard = await prisma.idCard.create({
      data: {
        userId: request.userId,
        organizationId: request.organizationId,
        cardNumber,
        qrToken,
        version: newVersion,
        status: 'ACTIVE',
        generatedByOrgAdminId: adminId,
        expiresAt: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000), // 2 years from now
      }
    });

    await prisma.idCardRequest.update({
      where: { id },
      data: {
        requestStatus: 'GENERATED',
        approvedByOrgAdminId: adminId,
      }
    });

    // Notify the member
    await prisma.notification.create({
      data: {
        userId: request.userId,
        title: 'Your ID Card has been approved and generated.'
      }
    });

    res.status(200).json({ message: 'Request approved and card generated.', data: newCard });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error approving request', error });
  }
};

export const rejectRequest = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user.userId;

    const request = await prisma.idCardRequest.update({
      where: { id },
      data: {
        requestStatus: 'REJECTED',
        approvedByOrgAdminId: adminId,
      }
    });

    res.status(200).json({ message: 'Request rejected.', data: request });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting request', error });
  }
};

export const verifyPayment = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    
    const request = await prisma.idCardRequest.update({
      where: { id },
      data: {
        paymentStatus: 'COMPLETED',
        requestStatus: 'PENDING', // Moves to pending approval
      }
    });

    res.status(200).json({ message: 'Payment verified.', data: request });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying payment', error });
  }
};

export const getGeneratedCards = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const admin = await prisma.user.findUnique({ where: { id: userId } });
    if (!admin?.organizationId) return res.status(403).json({ message: 'No organization access' });

    const cardsRaw = await prisma.idCard.findMany({
      where: { organizationId: admin.organizationId },
      include: {
        organization: {
          select: {
            name: true,
            users: {
              where: { role: 'orgAdmin' },
              select: { profile_photo_path: true },
              take: 1
            }
          }
        }
      },
      orderBy: { generatedAt: 'desc' }
    });

    // Manually fetch users to avoid Prisma "Inconsistent query result" error
    const userIds = [...new Set(cardsRaw.map(c => c.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, phone: true, sex: true, address: true, profile_photo_path: true, role: true }
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    const cards = cardsRaw
      .map(c => ({
        ...c,
        user: userMap.get(c.userId) || null
      }))
      .filter(c => c.user !== null);

    res.status(200).json(cards);
  } catch (error) {
    console.error('getGeneratedCards error:', error);
    res.status(500).json({ message: 'Error fetching generated cards', error });
  }
};

export const revokeCard = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const admin = await prisma.user.findUnique({ where: { id: req.user.userId } });

    const card = await prisma.idCard.findUnique({ where: { id } });
    if (!card || card.organizationId !== admin?.organizationId) {
      return res.status(404).json({ message: 'Card not found' });
    }

    const updatedCard = await prisma.idCard.update({
      where: { id },
      data: { status: 'REVOKED' }
    });

    res.status(200).json({ message: 'Card revoked.', data: updatedCard });
  } catch (error) {
    res.status(500).json({ message: 'Error revoking card', error });
  }
};

export const regenerateCard = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user.userId;
    const admin = await prisma.user.findUnique({ where: { id: adminId } });

    const oldCard = await prisma.idCard.findUnique({ where: { id } });
    if (!oldCard || oldCard.organizationId !== admin?.organizationId) {
      return res.status(404).json({ message: 'Card not found' });
    }

    // Invalidate all active cards for this user
    await prisma.idCard.updateMany({
      where: { userId: oldCard.userId, status: 'ACTIVE' },
      data: { status: 'REVOKED' }
    });

    const cardNumber = `ID-${Date.now().toString().slice(-6)}-${oldCard.userId.slice(-4)}`;
    const qrToken = crypto.randomUUID();

    const newCard = await prisma.idCard.create({
      data: {
        userId: oldCard.userId,
        organizationId: oldCard.organizationId,
        cardNumber,
        qrToken,
        version: oldCard.version + 1,
        status: 'ACTIVE',
        generatedByOrgAdminId: adminId,
      }
    });

    res.status(200).json({ message: 'Card regenerated.', data: newCard });
  } catch (error) {
    res.status(500).json({ message: 'Error regenerating card', error });
  }
};

export const getVerificationLogs = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const admin = await prisma.user.findUnique({ where: { id: userId } });
    if (!admin?.organizationId) return res.status(403).json({ message: 'No organization access' });

    const logs = await prisma.idCardVerificationLog.findMany({
      where: { organizationId: admin.organizationId },
      include: {
        member: { select: { name: true, email: true } }
      },
      orderBy: { scanTime: 'desc' },
      take: 100
    });

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching logs', error });
  }
};

// ----------------------------------------------------------------------
// PUBLIC VERIFICATION ENDPOINT
// ----------------------------------------------------------------------

export const verifyPublicQR = async (req: any, res: Response) => {
  try {
    const { qrToken } = req.params;

    const card = await prisma.idCard.findUnique({
      where: { qrToken },
      include: {
        user: { select: { id: true, name: true, role: true, profile_photo_path: true, phone: true, sex: true, address: true } },
        organization: { select: { id: true, name: true } }
      }
    });

    if (!card) {
      return res.status(404).json({ message: 'Invalid QR Token' });
    }

    // Log the scan asynchronously
    prisma.idCardVerificationLog.create({
      data: {
        idCardId: card.id,
        qrTokenScanned: qrToken,
        memberId: card.user.id,
        organizationId: card.organization.id,
        verificationResult: card.status,
        ipAddress: req.ip || req.headers['x-forwarded-for']?.toString(),
        deviceInfo: req.headers['user-agent']?.toString()
      }
    }).catch(e => console.error("Error logging verification:", e));

    const responseData = {
      name: card.user.name,
      photo: card.user.profile_photo_path,
      organization: card.organization.name,
      role: card.user.role,
      status: card.status,
      expiresAt: card.expiresAt,
      version: card.version,
      cardNumber: card.cardNumber,
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error verifying QR', error });
  }
};

export const updateCardDetails = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { expiresAt, name, role, sex, phone, address, cardNumber, generatedAt } = req.body;
    const admin = await prisma.user.findUnique({ where: { id: req.user.userId } });

    if (!admin || !admin.organizationId || admin.role !== 'orgAdmin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const card = await prisma.idCard.findUnique({ where: { id } });
    if (!card || card.organizationId !== admin.organizationId) {
      return res.status(404).json({ message: 'ID Card not found' });
    }

    // Update the ID Card expiration date, card number, and generation date
    const updatedCard = await prisma.idCard.update({
      where: { id },
      data: { 
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        ...(cardNumber ? { cardNumber } : {}),
        ...(generatedAt ? { generatedAt: new Date(generatedAt) } : {})
      }
    });

    // Update the User profile
    await prisma.user.update({
      where: { id: card.userId },
      data: {
        name,
        role,
        sex,
        phone,
        address
      }
    });

    res.json(updatedCard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating card details' });
  }
};
