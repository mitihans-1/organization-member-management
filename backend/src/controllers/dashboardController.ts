import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardStats = async (req: any, res: Response) => {
  const { userId, role } = req.user;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { plan: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (role === 'SuperAdmin') {
      const orgAdminCount = await prisma.user.count({ where: { role: 'orgAdmin' } });
      const memberCount = await prisma.user.count({ where: { role: 'member' } });
      const totalPayments = await prisma.payment.aggregate({
        _sum: { amount: true }
      });

      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const monthlyRegistrations = await prisma.user.count({
        where: { createdAt: { gte: thisMonthStart } }
      });

      const lastMonthRegistrations = await prisma.user.count({
        where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } }
      });

      const monthlyRevenue = await prisma.payment.aggregate({
        where: { createdAt: { gte: thisMonthStart } },
        _sum: { amount: true }
      });

      return res.status(200).json({
        stats: [
          { label: 'Total Organizations', value: orgAdminCount },
          { label: 'Total Members', value: memberCount },
          { label: 'Total Revenue', value: `${totalPayments._sum.amount || 0} ETB` },
          { label: 'Monthly Registrations', value: monthlyRegistrations },
          { label: 'Monthly Revenue', value: `${monthlyRevenue._sum.amount || 0} ETB` }
        ]
      });
    }

    if (role === 'orgAdmin') {
      const organizationId = user.organizationId;
      const orgName = user.organization_name;
      
      const memberUsers = await prisma.user.count({
        where: { organizationId, role: 'member' }
      });
      const membersFromModel = await prisma.member.count({
        where: { user: { organizationId } }
      });
      const totalMembers = memberUsers + membersFromModel;
      
      const payments = await prisma.payment.aggregate({
        where: { user: { organizationId } },
        _sum: { amount: true }
      });
      
      const events = await prisma.event.count({
        where: { organizationId }
      });
      
      const blogs = await prisma.blog.count({
        where: { organizationId }
      });
      
      const services = await prisma.service.count({
        where: { organizationId }
      });

      return res.status(200).json({
        stats: [
          { label: 'Total Members', value: totalMembers },
          { label: 'Upcoming Events', value: events },
          { label: 'Active Services', value: services },
          { label: 'Recent Blogs', value: blogs }
        ],
        totalPaidPayments: payments._sum.amount || 0,
        plan: user.plan,
        expiry: user.plan_expiry
      });
    }

    if (role === 'member') {
      const orgName = user.organization_name;
      const events = await prisma.event.count(); // Scoped events
      const blogs = await prisma.blog.count(); // Scoped blogs

      return res.status(200).json({
        stats: [
          { label: 'Upcoming Events', value: events },
          { label: 'Recent Blogs', value: blogs }
        ],
        plan: user.plan,
        expiry: user.plan_expiry
      });
    }

    res.status(400).json({ message: 'Invalid role' });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard stats', error });
  }
};

export const getAnalytics = async (req: any, res: Response) => {
  const { role } = req.user;
  const { startDate, endDate } = req.query;
  
  if (role !== 'SuperAdmin') {
    return res.status(403).json({ message: 'Super Admin only' });
  }

  try {
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    let dateFrom = startDate ? new Date(startDate as string) : oneYearAgo;
    let dateTo = endDate ? new Date(endDate as string) : now;

    const totalOrganizations = await prisma.user.count({ where: { role: 'orgAdmin' } });
    const totalMembers = await prisma.user.count({ where: { role: 'member' } });

    const monthlyRegistrations = await prisma.user.count({
      where: { createdAt: { gte: thisMonthStart } }
    });

    const lastMonthRegistrations = await prisma.user.count({
      where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } }
    });

    const totalRevenue = await prisma.payment.aggregate({
      _sum: { amount: true }
    });

    const monthlyRevenue = await prisma.payment.aggregate({
      where: { createdAt: { gte: thisMonthStart } },
      _sum: { amount: true }
    });

    const lastMonthRevenue = await prisma.payment.aggregate({
      where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } },
      _sum: { amount: true }
    });

    const activeOrgs = await prisma.user.count({
      where: { 
        role: 'orgAdmin', 
        is_verified: true 
      }
    });

    const payments = await prisma.payment.findMany({
      where: { createdAt: { gte: dateFrom, lte: dateTo } },
      select: { createdAt: true, amount: true },
      orderBy: { createdAt: 'asc' }
    });

    const registrations = await prisma.user.findMany({
      where: { createdAt: { gte: dateFrom, lte: dateTo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' }
    });

    const getMonthlyData = (data: any[], key?: string) => {
      const monthlyMap: Record<string, number> = {};
      
      for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap[monthKey] = 0;
      }

      data.forEach(item => {
        const date = new Date(item.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyMap[monthKey] !== undefined) {
          monthlyMap[monthKey] += key ? (item[key] || 0) : 1;
        }
      });

      return Object.entries(monthlyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, value]) => ({
          month: new Date(month + '-01').toLocaleString('default', { month: 'short' }),
          value
        }));
    };

    const revenueChartData = getMonthlyData(payments, 'amount');
    const registrationChartData = getMonthlyData(registrations);

    const orgPaymentSums = await prisma.payment.groupBy({
      by: ['user_id'],
      where: { createdAt: { gte: dateFrom, lte: dateTo } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 10
    });

    const topOrgs = await Promise.all(
      orgPaymentSums.map(async (sum) => {
        const user = await prisma.user.findUnique({
          where: { id: sum.user_id },
          select: { name: true, organization_name: true }
        });
        return {
          name: user?.organization_name || user?.name || 'Unknown',
          revenue: sum._sum.amount || 0
        };
      })
    );

    const registrationGrowth = lastMonthRegistrations > 0 
      ? Math.round(((monthlyRegistrations - lastMonthRegistrations) / lastMonthRegistrations) * 100)
      : 100;

    const revenueGrowth = (lastMonthRevenue._sum.amount || 0) > 0 
      ? Math.round((( (monthlyRevenue._sum.amount || 0) - (lastMonthRevenue._sum.amount || 0) ) / (lastMonthRevenue._sum.amount || 0)) * 100)
      : 100;

    // Calculate churn rate: number of organizations that had no payments in the last 3 months
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const activeOrgIds = (await prisma.payment.findMany({
      where: { createdAt: { gte: threeMonthsAgo } },
      select: { user_id: true },
      distinct: ['user_id']
    })).map(p => p.user_id);
    
    const totalOrgsCount = await prisma.user.count({ where: { role: 'orgAdmin' } });
    const churnedOrgs = totalOrgsCount - activeOrgIds.length;
    const churnRate = totalOrgsCount > 0 ? Math.round((churnedOrgs / totalOrgsCount) * 100) : 0;

    return res.status(200).json({
      totalOrganizations,
      totalMembers,
      monthlyRegistrations,
      registrationGrowth,
      totalRevenue: totalRevenue._sum.amount || 0,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      revenueGrowth,
      activeOrganizations: activeOrgs,
      revenueChartData,
      registrationChartData,
      topOrganizations: topOrgs,
      churnRate
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Error fetching analytics', error });
  }
};
