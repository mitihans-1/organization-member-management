import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getMemberReports = async (req: any, res: Response) => {
  try {
    const { userId } = req.user;
    const reports = await prisma.report.findMany({
      where: { memberId: userId },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(reports);
  } catch (error) {
    console.error('Error fetching member reports:', error);
    res.status(500).json({ message: 'Error fetching reports', error });
  }
};

export const getOrgReports = async (req: any, res: Response) => {
  try {
    const { userId } = req.user;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, organization_name: true }
    });

    let orgId = user?.organizationId;
    if (!orgId && user?.organization_name) {
      const org = await prisma.organization.findFirst({
        where: { name: user.organization_name }
      });
      if (org) {
        orgId = org.id;
      }
    }

    if (!orgId) {
      return res.status(400).json({ message: 'User not associated with an organization' });
    }

    const reports = await prisma.report.findMany({
      where: { organizationId: orgId },
      include: { member: true, organization: true },
      orderBy: { createdAt: 'desc' }
    });

    const memberReports = reports.filter(r => r.reportType === 'member_to_org');
    const orgReports = reports.filter(r => r.reportType === 'org_to_superadmin');

    res.status(200).json({ memberReports, orgReports });
  } catch (error) {
    console.error('Error fetching org reports:', error);
    res.status(500).json({ message: 'Error fetching reports', error });
  }
};

export const getSuperAdminReports = async (req: any, res: Response) => {
  try {
    const reports = await prisma.report.findMany({
      include: { member: true, organization: true },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(reports);
  } catch (error) {
    console.error('Error fetching super admin reports:', error);
    res.status(500).json({ message: 'Error fetching reports', error });
  }
};

export const createReport = async (req: any, res: Response) => {
  try {
    const { userId, role } = req.user;
    const { title, description, priority, reportType } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, organization_name: true }
    });

    let orgId = user?.organizationId;
    if (!orgId && user?.organization_name) {
      const org = await prisma.organization.findFirst({
        where: { name: user.organization_name }
      });
      if (org) {
        orgId = org.id;
        await prisma.user.update({
          where: { id: userId },
          data: { organizationId: org.id }
        });
      }
    }

    if (!orgId) {
      return res.status(400).json({ message: 'User not associated with an organization' });
    }

    const data: any = {
      title,
      description,
      priority: priority || 'medium',
      organizationId: orgId,
    };

    if (req.file) {
      data.attachment = req.file.path;
    }

    if (role === 'member') {
      data.memberId = userId;
      data.reportType = 'member_to_org';
    } else if (role === 'orgAdmin') {
      data.reportType = reportType || 'org_to_superadmin';
    }

    const report = await prisma.report.create({
      data,
      include: { member: true, organization: true }
    });

    res.status(201).json(report);
  } catch (error: any) {
    console.error('Error creating report:', error);
    res.status(500).json({ message: 'Error creating report', error: error.message || error });
  }
};

export const updateReport = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, priority } = req.body;
    const { userId, role } = req.user;

    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (role === 'member') {
      if (report.memberId !== userId) {
        return res.status(403).json({ message: 'You can only update your own reports' });
      }
      const updatedReport = await prisma.report.update({
        where: { id },
        data: { title, description, priority },
        include: { member: true, organization: true }
      });
      return res.status(200).json(updatedReport);
    }

    if (role === 'orgAdmin' || role === 'SuperAdmin') {
      const updatedReport = await prisma.report.update({
        where: { id },
        data: { title, description, priority },
        include: { member: true, organization: true }
      });
      return res.status(200).json(updatedReport);
    }

    res.status(403).json({ message: 'Unauthorized' });
  } catch (error: any) {
    console.error('Error updating report:', error);
    res.status(500).json({ message: 'Error updating report', error: error.message || error });
  }
};

export const updateReportStatus = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { role } = req.user;

    if (role !== 'orgAdmin' && role !== 'SuperAdmin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const updatedReport = await prisma.report.update({
      where: { id },
      data: { status },
      include: { member: true, organization: true }
    });

    res.status(200).json(updatedReport);
  } catch (error: any) {
    console.error('Error updating report status:', error);
    res.status(500).json({ message: 'Error updating report status', error: error.message || error });
  }
};

export const updateReportPriority = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;
    const { role } = req.user;

    if (role !== 'orgAdmin' && role !== 'SuperAdmin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const updatedReport = await prisma.report.update({
      where: { id },
      data: { priority },
      include: { member: true, organization: true }
    });

    res.status(200).json(updatedReport);
  } catch (error: any) {
    console.error('Error updating report priority:', error);
    res.status(500).json({ message: 'Error updating report priority', error: error.message || error });
  }
};

export const deleteReport = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user;

    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (role === 'member' && report.memberId !== userId) {
      return res.status(403).json({ message: 'You can only delete your own reports' });
    }

    await prisma.report.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ message: 'Error deleting report', error });
  }
};

export const acceptReport = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.user;

    if (role !== 'orgAdmin' && role !== 'SuperAdmin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const updatedReport = await prisma.report.update({
      where: { id },
      data: { accepted: true },
      include: { member: true, organization: true },
    });

    res.status(200).json(updatedReport);
  } catch (error) {
    console.error('Error accepting report:', error);
    res.status(500).json({ message: 'Error accepting report', error });
  }
};

export const replyToReport = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { response } = req.body;
    const { role } = req.user;

    if (role !== 'orgAdmin' && role !== 'SuperAdmin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const updatedReport = await prisma.report.update({
      where: { id },
      data: { response },
      include: { member: true, organization: true },
    });

    res.status(200).json(updatedReport);
  } catch (error) {
    console.error('Error replying to report:', error);
    res.status(500).json({ message: 'Error replying to report', error });
  }
};
