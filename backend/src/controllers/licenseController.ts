import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// ==========================================
// MEMBER ENDPOINTS
// ==========================================

export const requestLicense = async (req: any, res: Response) => {
  try {
    const { requestType, reason, phone, sex, address, licensePlanId } = req.body;
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user || !user.organizationId) {
      return res.status(400).json({ message: 'User or Organization not found.' });
    }

    // Check if there is already a pending request
    const existingRequest = await prisma.licenseRequest.findFirst({
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

    const newRequest = await prisma.licenseRequest.create({
      data: {
        userId,
        organizationId: user.organizationId,
        requestType: requestType || 'FIRST_TIME',
        reason: reason || null,
        licensePlanId,
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
          title: `New License request from ${user.name}`
        }))
      });
    }

    res.status(201).json({ message: 'Request submitted successfully.', data: newRequest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error submitting request', error });
  }
};

export const getMyLicense = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;

    const license = await prisma.license.findFirst({
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

    const activeRequest = await prisma.licenseRequest.findFirst({
      where: {
        userId,
        requestStatus: { in: ['PENDING', 'PENDING_PAYMENT_VERIFICATION'] }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ license, activeRequest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching license details.', error });
  }
};

export const logPrint = async (req: any, res: Response) => {
  try {
    const { licenseId } = req.body;
    const userId = req.user.userId;
    const role = req.user.role;

    const license = await prisma.license.findUnique({ where: { id: licenseId } });
    if (!license) return res.status(404).json({ message: 'License not found' });

    // Ensure member only logs their own license
    if (role === 'member' && license.userId !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await prisma.licensePrintLog.create({
      data: {
        licenseId,
        printedById: userId,
        printedByRole: role,
      }
    });

    await prisma.license.update({
      where: { id: licenseId },
      data: { printCount: { increment: 1 } }
    });

    res.status(200).json({ message: 'Print logged successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error logging print', error });
  }
};

// ==========================================
// ORG ADMIN ENDPOINTS
// ==========================================

export const getRequests = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const admin = await prisma.user.findUnique({ where: { id: userId } });
    if (!admin?.organizationId) return res.status(403).json({ message: 'No organization access' });

    const requestsRaw = await prisma.licenseRequest.findMany({
      where: { organizationId: admin.organizationId },
      include: { payment: true },
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

    const request = await prisma.licenseRequest.findUnique({ 
      where: { id }, 
      include: { licensePlan: true } 
    });
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.requestType === 'REPLACEMENT' && request.paymentStatus !== 'COMPLETED') {
      return res.status(400).json({ message: 'Cannot approve replacement before payment is verified.' });
    }

    // Invalidate existing active licenses
    await prisma.license.updateMany({
      where: { userId: request.userId, status: 'ACTIVE' },
      data: { status: 'REVOKED' }
    });

    // Find previous version to increment
    const previousLicense = await prisma.license.findFirst({
      where: { userId: request.userId },
      orderBy: { version: 'desc' }
    });
    const newVersion = previousLicense ? previousLicense.version + 1 : 1;
    const { formatConfig } = req.body;
    let licenseNumber = '';
    
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

      licenseNumber = `${prefix}${randomPart}${suffix}`;
    } else {
      licenseNumber = `LIC-${Date.now().toString().slice(-6)}-${request.userId.slice(-4)}`;
    }
    
    const qrToken = crypto.randomUUID();
    const durationDays = request.licensePlan?.durationDays || 365 * 2; // default 2 years

    const newLicense = await prisma.license.create({
      data: {
        userId: request.userId,
        organizationId: request.organizationId,
        licenseNumber,
        qrToken,
        version: newVersion,
        status: 'ACTIVE',
        generatedByOrgAdminId: adminId,
        expiresAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
      }
    });

    await prisma.licenseRequest.update({
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
        title: 'Your License has been approved and generated.'
      }
    });

    res.status(200).json({ message: 'Request approved and license generated.', data: newLicense });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error approving request', error });
  }
};

export const rejectRequest = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user.userId;

    const request = await prisma.licenseRequest.update({
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
    
    const request = await prisma.licenseRequest.update({
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

export const getGeneratedLicenses = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const admin = await prisma.user.findUnique({ where: { id: userId } });
    if (!admin?.organizationId) return res.status(403).json({ message: 'No organization access' });

    const licensesRaw = await prisma.license.findMany({
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
    const userIds = [...new Set(licensesRaw.map(c => c.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, phone: true, sex: true, address: true, profile_photo_path: true, role: true }
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    const licenses = licensesRaw
      .map(c => ({
        ...c,
        user: userMap.get(c.userId) || null
      }))
      .filter(c => c.user !== null);

    res.status(200).json(licenses);
  } catch (error) {
    console.error('getGeneratedLicenses error:', error);
    res.status(500).json({ message: 'Error fetching generated licenses', error });
  }
};

export const revokeLicense = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const admin = await prisma.user.findUnique({ where: { id: req.user.userId } });

    const license = await prisma.license.findUnique({ where: { id } });
    if (!license || license.organizationId !== admin?.organizationId) {
      return res.status(404).json({ message: 'License not found' });
    }

    const updatedLicense = await prisma.license.update({
      where: { id },
      data: { status: 'REVOKED' }
    });

    res.status(200).json({ message: 'License revoked.', data: updatedLicense });
  } catch (error) {
    res.status(500).json({ message: 'Error revoking license', error });
  }
};

export const regenerateLicense = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user.userId;
    const admin = await prisma.user.findUnique({ where: { id: adminId } });

    const oldLicense = await prisma.license.findUnique({ where: { id } });
    if (!oldLicense || oldLicense.organizationId !== admin?.organizationId) {
      return res.status(404).json({ message: 'License not found' });
    }

    // Invalidate all active licenses for this user
    await prisma.license.updateMany({
      where: { userId: oldLicense.userId, status: 'ACTIVE' },
      data: { status: 'REVOKED' }
    });

    const licenseNumber = `LIC-${Date.now().toString().slice(-6)}-${oldLicense.userId.slice(-4)}`;
    const qrToken = crypto.randomUUID();

    const newLicense = await prisma.license.create({
      data: {
        userId: oldLicense.userId,
        organizationId: oldLicense.organizationId,
        licenseNumber,
        qrToken,
        version: oldLicense.version + 1,
        status: 'ACTIVE',
        generatedByOrgAdminId: adminId,
      }
    });

    res.status(200).json({ message: 'License regenerated.', data: newLicense });
  } catch (error) {
    res.status(500).json({ message: 'Error regenerating license', error });
  }
};

export const getVerificationLogs = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const admin = await prisma.user.findUnique({ where: { id: userId } });
    if (!admin?.organizationId) return res.status(403).json({ message: 'No organization access' });

    const logs = await prisma.licenseVerificationLog.findMany({
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

// ==========================================
// PUBLIC VERIFICATION ENDPOINT
// ==========================================

export const verifyPublicQR = async (req: any, res: Response) => {
  try {
    const { qrToken } = req.params;

    const license = await prisma.license.findUnique({
      where: { qrToken },
      include: {
        user: { select: { id: true, name: true, role: true, profile_photo_path: true, phone: true, sex: true, address: true } },
        organization: { select: { id: true, name: true } }
      }
    });

    if (!license) {
      return res.status(404).json({ message: 'Invalid QR Token' });
    }

    // Log the scan asynchronously
    prisma.licenseVerificationLog.create({
      data: {
        licenseId: license.id,
        qrTokenScanned: qrToken,
        memberId: license.user.id,
        organizationId: license.organization.id,
        verificationResult: license.status,
        ipAddress: req.ip || req.headers['x-forwarded-for']?.toString(),
        deviceInfo: req.headers['user-agent']?.toString()
      }
    }).catch(e => console.error("Error logging verification:", e));

    const responseData = {
      name: license.user.name,
      photo: license.user.profile_photo_path,
      organization: license.organization.name,
      role: license.user.role,
      status: license.status,
      expiresAt: license.expiresAt,
      version: license.version,
      licenseNumber: license.licenseNumber,
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error verifying QR', error });
  }
};

export const updateLicenseDetails = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { expiresAt, name, role, sex, phone, address, licenseNumber, generatedAt } = req.body;
    const admin = await prisma.user.findUnique({ where: { id: req.user.userId } });

    if (!admin || !admin.organizationId || admin.role !== 'orgAdmin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const license = await prisma.license.findUnique({ where: { id } });
    if (!license || license.organizationId !== admin.organizationId) {
      return res.status(404).json({ message: 'License not found' });
    }

    // Update the License expiration date, license number, and generation date
    const updatedLicense = await prisma.license.update({
      where: { id },
      data: { 
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        ...(licenseNumber ? { licenseNumber } : {}),
        ...(generatedAt ? { generatedAt: new Date(generatedAt) } : {})
      }
    });

    // Update the User profile
    await prisma.user.update({
      where: { id: license.userId },
      data: {
        name,
        role,
        sex,
        phone,
        address
      }
    });

    res.json(updatedLicense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating license details' });
  }
};
