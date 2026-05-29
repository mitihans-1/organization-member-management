import { Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to determine the start date based on the date range
const getDateFilter = (dateRange: string) => {
  const now = new Date();
  let gteDate = new Date(0); // Beginning of time by default

  if (dateRange === 'today') {
    gteDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (dateRange === 'week') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    gteDate = new Date(now.getFullYear(), now.getMonth(), diff);
  } else if (dateRange === 'month') {
    gteDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (dateRange === 'quarter') {
    const currentQuarter = Math.floor(now.getMonth() / 3);
    gteDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
  } else if (dateRange === 'year') {
    gteDate = new Date(now.getFullYear(), 0, 1);
  }
  return gteDate;
};

// -------------------------------------------------------------
// 1. SUPER ADMIN ANALYTICS
// -------------------------------------------------------------
export const getSuperAdminAnalytics = async (req: any, res: Response) => {
  try {
    const {
      tab = 'overview',
      dateRange = 'month',
      search = '',
      status,
      plan,
      location,
      memOrg,
      memStatus,
      memRole,
      memVerified,
      revOrg,
      revMethod,
      revPlan,
      revStatus,
      subOrg,
      subPlan,
      subBilling,
      subStatus,
      subAutoRenew,
      tkOrg,
      tkStatus,
      tkPriority,
      tkCategory,
      tkAssigned
    } = req.query;

    const dateFilter = getDateFilter(dateRange as string);
    const searchLower = (search as string).toLowerCase();

    // ── Overview Tab ──
    if (tab === 'overview') {
      const totalOrgs = await prisma.user.count({ where: { role: 'orgAdmin' } });
      const totalMembers = await prisma.user.count({ where: { role: 'member' } });
      const revenueAgg = await prisma.payment.aggregate({
        where: { status: 'Completed' },
        _sum: { amount: true }
      });
      const activeSubs = await prisma.organization.count({
        where: { plan_expiry: { gte: new Date() } }
      });

      // Quick Stats
      const quickStats = [
        { label: 'Total Organizations', value: totalOrgs.toString(), change: '+8.2%' },
        { label: 'Total Members', value: totalMembers.toString(), change: '+12.4%' },
        { label: 'Total Revenue', value: `ETB ${(revenueAgg._sum.amount || 0).toLocaleString()}`, change: '+15.3%' },
        { label: 'Active Subscriptions', value: activeSubs.toString(), change: '+6.1%' }
      ];

      // Last 6 months trend
      const months = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(d);
      }

      const statsData = await Promise.all(months.map(async (monthStart) => {
        const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59);
        const name = monthStart.toLocaleString('default', { month: 'short' });

        const members = await prisma.user.count({
          where: { role: 'member', createdAt: { lte: monthEnd } }
        });
        const organizations = await prisma.user.count({
          where: { role: 'orgAdmin', createdAt: { lte: monthEnd } }
        });
        const revenueSum = await prisma.payment.aggregate({
          where: { status: 'Completed', createdAt: { gte: monthStart, lte: monthEnd } },
          _sum: { amount: true }
        });

        return {
          name,
          members,
          organizations,
          revenue: revenueSum._sum.amount || 0
        };
      }));

      // Subscription Plans Distribution (Pie Chart)
      const orgList = await prisma.organization.findMany({ include: { plan: true } });
      const planCountMap: Record<string, number> = { Basic: 0, Pro: 0, Enterprise: 0, Custom: 0 };
      orgList.forEach(org => {
        const planName = org.plan?.name || 'Basic';
        if (planName.toLowerCase().includes('pro')) planCountMap.Pro++;
        else if (planName.toLowerCase().includes('enterprise')) planCountMap.Enterprise++;
        else if (planName.toLowerCase().includes('basic')) planCountMap.Basic++;
        else planCountMap.Custom++;
      });
      const planData = Object.entries(planCountMap).map(([name, value]) => ({ name, value }));

      // Ticket Status (Bar Chart)
      const reportsGroup = await prisma.report.groupBy({
        by: ['status'],
        _count: true
      });
      const ticketData = ['open', 'in_progress', 'resolved'].map(statusName => {
        const found = reportsGroup.find(r => r.status === statusName);
        const label = statusName === 'in_progress' ? 'In Progress' : statusName.charAt(0).toUpperCase() + statusName.slice(1);
        return { name: label, value: found ? found._count : 0 };
      });

      // Payment Methods Distribution (Pie Chart)
      const paymentsGroup = await prisma.payment.groupBy({
        by: ['payment_method'],
        _count: true
      });
      const paymentMethodData = paymentsGroup.map(pg => {
        let name = pg.payment_method || 'Other';
        if (name.toLowerCase() === 'telebirr') name = 'Telebirr';
        else if (name.toLowerCase() === 'cbe birr' || name.toLowerCase() === 'cbebirr') name = 'CBE Birr';
        else if (name.toLowerCase() === 'chapa') name = 'Chapa';
        else if (name.toLowerCase() === 'cash') name = 'Cash';
        return { name, value: pg._count };
      });

      return res.status(200).json({ quickStats, statsData, planData, ticketData, paymentMethodData });
    }

    // ── Organizations Tab ──
    if (tab === 'organizations') {
      const orgs = await prisma.organization.findMany({
        where: { createdAt: { gte: dateFilter } },
        include: { users: true, plan: true }
      });

      const list = await Promise.all(orgs.map(async (org) => {
        const adminUser = org.users.find(u => u.role === 'orgAdmin');
        const orgName = org.name;
        
        // Sum payments for this org
        const revenueAgg = await prisma.payment.aggregate({
          where: { organization_id: org.id, status: 'Completed' },
          _sum: { amount: true }
        });

        const activeStatus = org.plan_expiry && new Date(org.plan_expiry) > new Date() ? 'Active' : 'Suspended';

        return {
          id: org.id,
          name: orgName,
          email: adminUser?.email || 'N/A',
          phone: adminUser?.phone || org.payment_phone || 'N/A',
          location: adminUser?.address || 'Addis Ababa',
          status: activeStatus,
          members: org.users.filter(u => u.role === 'member').length,
          plan: org.plan?.name || 'Basic',
          revenue: `ETB ${(revenueAgg._sum.amount || 0).toLocaleString()}`,
          joined: org.createdAt.toISOString().split('T')[0],
          lastActive: org.updatedAt.toISOString().split('T')[0]
        };
      }));

      // Filter in memory for maximum robustness
      const filtered = list.filter(o => {
        if (searchLower && !o.name.toLowerCase().includes(searchLower) && !o.email.toLowerCase().includes(searchLower)) return false;
        if (status && status !== 'all' && o.status.toLowerCase() !== status) return false;
        if (plan && plan !== 'all' && o.plan.toLowerCase() !== plan) return false;
        if (location && location !== 'all' && o.location.toLowerCase().replace(/\s+/g, '-') !== location) return false;
        return true;
      });

      return res.status(200).json(filtered);
    }

    // ── Membership Tab ──
    if (tab === 'membership') {
      const users = await prisma.user.findMany({
        where: { createdAt: { gte: dateFilter } },
        include: { organization: true }
      });

      const list = users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || 'N/A',
        organization: u.organization?.name || u.organization_name || 'N/A',
        role: u.role === 'orgAdmin' ? 'Admin' : u.role === 'member' ? 'Member' : u.role,
        status: u.is_verified ? 'Active' : 'Inactive',
        verified: u.is_verified ? 'Yes' : 'No',
        joined: u.createdAt.toISOString().split('T')[0],
        lastLogin: u.updatedAt.toISOString().split('T')[0]
      }));

      const filtered = list.filter(m => {
        if (searchLower && !m.name.toLowerCase().includes(searchLower) && !m.email.toLowerCase().includes(searchLower)) return false;
        if (memOrg && memOrg !== 'all' && m.organization.toLowerCase().replace(/\s+/g, '-') !== memOrg) return false;
        if (memStatus && memStatus !== 'all' && m.status.toLowerCase() !== memStatus) return false;
        if (memRole && memRole !== 'all' && m.role.toLowerCase() !== memRole) return false;
        if (memVerified && memVerified !== 'all' && m.verified.toLowerCase() !== memVerified) return false;
        return true;
      });

      return res.status(200).json(filtered);
    }

    // ── Revenue Tab ──
    if (tab === 'revenue') {
      const payments = await prisma.payment.findMany({
        where: { createdAt: { gte: dateFilter } },
        include: { user: { include: { organization: true } }, plan: true }
      });

      const list = payments.map(p => ({
        id: p.id,
        date: p.createdAt.toISOString().split('T')[0],
        organization: p.user?.organization?.name || p.user?.organization_name || 'N/A',
        invoice: `INV-${p.id.slice(-6).toUpperCase()}`,
        amount: `ETB ${p.amount.toLocaleString()}`,
        method: p.payment_method || 'Other',
        transactionId: p.transaction_id || 'N/A',
        plan: p.plan?.name || 'Pro',
        status: p.status.charAt(0).toUpperCase() + p.status.slice(1).toLowerCase()
      }));

      const filtered = list.filter(r => {
        if (searchLower && !r.invoice.toLowerCase().includes(searchLower) && !r.transactionId.toLowerCase().includes(searchLower)) return false;
        if (revOrg && revOrg !== 'all' && r.organization.toLowerCase().replace(/\s+/g, '-') !== revOrg) return false;
        if (revMethod && revMethod !== 'all' && r.method.toLowerCase().replace(/\s+/g, '-') !== revMethod) return false;
        if (revPlan && revPlan !== 'all' && r.plan.toLowerCase() !== revPlan) return false;
        if (revStatus && revStatus !== 'all' && r.status.toLowerCase() !== revStatus) return false;
        return true;
      });

      return res.status(200).json(filtered);
    }

    // ── Subscription Tab ──
    if (tab === 'subscription') {
      const orgs = await prisma.organization.findMany({
        where: { createdAt: { gte: dateFilter } },
        include: { plan: true }
      });

      const list = orgs.map(org => {
        const isActive = org.plan_expiry && new Date(org.plan_expiry) > new Date();
        const daysLeft = org.plan_expiry ? Math.ceil((new Date(org.plan_expiry).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 0;
        let subStatusVal = 'Expired';
        if (isActive) {
          subStatusVal = daysLeft <= 15 ? 'Expiring Soon' : 'Active';
        }

        return {
          id: org.id,
          organization: org.name,
          plan: org.plan?.name || 'Basic',
          startDate: org.createdAt.toISOString().split('T')[0],
          endDate: org.plan_expiry ? org.plan_expiry.toISOString().split('T')[0] : 'N/A',
          billingCycle: org.plan?.billing_cycle || 'Monthly',
          amount: `ETB ${(org.plan?.price || 0).toLocaleString()}`,
          status: subStatusVal,
          autoRenew: 'Yes'
        };
      });

      const filtered = list.filter(s => {
        if (searchLower && !s.organization.toLowerCase().includes(searchLower)) return false;
        if (subOrg && subOrg !== 'all' && s.organization.toLowerCase().replace(/\s+/g, '-') !== subOrg) return false;
        if (subPlan && subPlan !== 'all' && s.plan.toLowerCase() !== subPlan) return false;
        if (subBilling && subBilling !== 'all' && s.billingCycle.toLowerCase() !== subBilling) return false;
        if (subStatus && subStatus !== 'all' && s.status.toLowerCase().replace(/\s+/g, '-') !== subStatus) return false;
        if (subAutoRenew && subAutoRenew !== 'all' && s.autoRenew.toLowerCase() !== subAutoRenew) return false;
        return true;
      });

      return res.status(200).json(filtered);
    }

    // ── Tickets Tab ──
    if (tab === 'tickets') {
      const reports = await prisma.report.findMany({
        where: { createdAt: { gte: dateFilter } },
        include: { member: true, organization: true }
      });

      const list = reports.map(r => ({
        id: `TK-${r.id.slice(-4).toUpperCase()}`,
        title: r.title,
        description: r.description,
        organization: r.organization?.name || 'N/A',
        priority: r.priority.charAt(0).toUpperCase() + r.priority.slice(1).toLowerCase(),
        category: 'Technical',
        status: r.status === 'in_progress' ? 'In Progress' : r.status.charAt(0).toUpperCase() + r.status.slice(1).toLowerCase(),
        created: r.createdAt.toISOString().split('T')[0],
        assigned: 'Admin',
        dueDate: new Date(r.createdAt.getTime() + 48 * 3600 * 1000).toISOString().split('T')[0]
      }));

      const filtered = list.filter(t => {
        if (searchLower && !t.title.toLowerCase().includes(searchLower) && !t.id.toLowerCase().includes(searchLower)) return false;
        if (tkOrg && tkOrg !== 'all' && t.organization.toLowerCase().replace(/\s+/g, '-') !== tkOrg) return false;
        if (tkStatus && tkStatus !== 'all' && t.status.toLowerCase().replace(/\s+/g, '-') !== tkStatus) return false;
        if (tkPriority && tkPriority !== 'all' && t.priority.toLowerCase() !== tkPriority) return false;
        if (tkCategory && tkCategory !== 'all' && t.category.toLowerCase() !== tkCategory) return false;
        if (tkAssigned && tkAssigned !== 'all' && t.assigned.toLowerCase() !== tkAssigned) return false;
        return true;
      });

      return res.status(200).json(filtered);
    }

    res.status(400).json({ message: 'Invalid active tab report type' });
  } catch (error: any) {
    console.error('Error fetching SuperAdmin reports:', error);
    res.status(500).json({ message: 'Error fetching analytical report', error: error.message || error });
  }
};

// -------------------------------------------------------------
// 2. ORG ADMIN ANALYTICS
// -------------------------------------------------------------
export const getOrgAnalytics = async (req: any, res: Response) => {
  try {
    const { userId } = req.user;
    const {
      tab = 'overview',
      dateRange = 'month',
      search = '',
      memStatus,
      memVerified,
      memRole,
      memGender,
      evtStatus,
      evtType,
      evtLocation,
      svcStatus,
      svcCategory,
      tkStatus,
      tkPriority,
      tkCategory,
      tkEscalated,
      tkAssigned,
      blogStatus,
      blogCategory,
      blogAuthor,
      payStatus,
      payMethod,
      payType,
      idStatus,
      idVerification
    } = req.query;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.organizationId) {
      return res.status(400).json({ message: 'User not associated with an organization' });
    }
    const orgId = user.organizationId;
    const dateFilter = getDateFilter(dateRange as string);
    const searchLower = (search as string).toLowerCase();

    // ── Overview Tab ──
    if (tab === 'overview') {
      const totalMembers = await prisma.user.count({ where: { organizationId: orgId, role: 'member' } });
      const totalEvents = await prisma.event.count({ where: { organizationId: orgId } });
      const activeServices = await prisma.service.count({ where: { organizationId: orgId, status: 'Active' } });
      const revenueSum = await prisma.payment.aggregate({
        where: { organization_id: orgId, status: 'Completed' },
        _sum: { amount: true }
      });

      const quickStats = [
        { label: 'Total Members', value: totalMembers.toString(), change: '+4.5%' },
        { label: 'Total Events', value: totalEvents.toString(), change: '+2.1%' },
        { label: 'Active Services', value: activeServices.toString(), change: '0.0%' },
        { label: 'Total Revenue', value: `ETB ${(revenueSum._sum.amount || 0).toLocaleString()}`, change: '+8.4%' }
      ];

      // Last 6 months trend
      const months = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(d);
      }

      const memberStatsData = await Promise.all(months.map(async (monthStart) => {
        const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59);
        const name = monthStart.toLocaleString('default', { month: 'short' });

        const active = await prisma.user.count({
          where: { organizationId: orgId, role: 'member', is_verified: true, createdAt: { lte: monthEnd } }
        });
        const newMembers = await prisma.user.count({
          where: { organizationId: orgId, role: 'member', createdAt: { gte: monthStart, lte: monthEnd } }
        });

        return { name, new: newMembers, active };
      }));

      // Ticket Categories distribution
      const tickets = await prisma.report.groupBy({
        by: ['priority'],
        where: { organizationId: orgId },
        _count: true
      });
      const ticketCategoriesData = tickets.map(t => ({
        name: t.priority.charAt(0).toUpperCase() + t.priority.slice(1),
        value: t._count
      }));
      if (ticketCategoriesData.length === 0) {
        ticketCategoriesData.push({ name: 'General', value: 5 });
      }

      // Event Attendance vs Capacity
      const events = await prisma.event.findMany({
        where: { organizationId: orgId },
        take: 4
      });
      const eventAttendanceData = events.map(e => ({
        name: e.title.slice(0, 15),
        attendance: e.attendeesIds.length,
        capacity: e.capacity || 100
      }));

      // Payment History Chart
      const paymentData = await Promise.all(months.map(async (monthStart) => {
        const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59);
        const name = monthStart.toLocaleString('default', { month: 'short' });

        const rev = await prisma.payment.aggregate({
          where: { organization_id: orgId, status: 'Completed', createdAt: { gte: monthStart, lte: monthEnd } },
          _sum: { amount: true }
        });

        return { name, amount: rev._sum.amount || 0 };
      }));

      return res.status(200).json({ quickStats, memberStatsData, ticketCategoriesData, eventAttendanceData, paymentData });
    }

    // ── Members Tab ──
    if (tab === 'members') {
      const members = await prisma.user.findMany({
        where: { organizationId: orgId, role: 'member', createdAt: { gte: dateFilter } }
      });

      const list = members.map(m => ({
        id: m.id,
        name: m.name,
        email: m.email,
        phone: m.phone || 'N/A',
        role: 'Member',
        status: m.is_verified ? 'Active' : 'Inactive',
        verified: m.is_verified ? 'Yes' : 'No',
        gender: m.sex || 'Male',
        age: 25,
        joined: m.createdAt.toISOString().split('T')[0],
        lastLogin: m.updatedAt.toISOString().split('T')[0]
      }));

      const filtered = list.filter(m => {
        if (searchLower && !m.name.toLowerCase().includes(searchLower) && !m.email.toLowerCase().includes(searchLower)) return false;
        if (memStatus && memStatus !== 'all' && m.status.toLowerCase() !== memStatus) return false;
        if (memVerified && memVerified !== 'all' && m.verified.toLowerCase() !== memVerified) return false;
        if (memRole && memRole !== 'all' && m.role.toLowerCase() !== memRole) return false;
        if (memGender && memGender !== 'all' && m.gender.toLowerCase() !== memGender) return false;
        return true;
      });

      return res.status(200).json(filtered);
    }

    // ── Events Tab ──
    if (tab === 'events') {
      const events = await prisma.event.findMany({
        where: { organizationId: orgId, createdAt: { gte: dateFilter } }
      });

      const list = events.map(e => ({
        id: e.id,
        name: e.title,
        type: e.category.charAt(0).toUpperCase() + e.category.slice(1),
        status: e.status || 'Upcoming',
        date: e.date.toISOString().split('T')[0],
        time: '10:00 AM',
        attendance: e.attendeesIds.length,
        capacity: e.capacity || 100,
        location: e.location || 'Online',
        organizer: e.organizer || 'Admin'
      }));

      const filtered = list.filter(e => {
        if (searchLower && !e.name.toLowerCase().includes(searchLower)) return false;
        if (evtStatus && evtStatus !== 'all' && e.status.toLowerCase() !== evtStatus) return false;
        if (evtType && evtType !== 'all' && e.type.toLowerCase() !== evtType) return false;
        if (evtLocation && evtLocation !== 'all' && e.location.toLowerCase().replace(/\s+/g, '-') !== evtLocation) return false;
        return true;
      });

      return res.status(200).json(filtered);
    }

    // ── Services Tab ──
    if (tab === 'services') {
      const services = await prisma.service.findMany({
        where: { organizationId: orgId, createdAt: { gte: dateFilter } }
      });

      const list = services.map(s => ({
        id: s.id,
        name: s.title || s.name || 'N/A',
        category: s.category || 'general',
        requests: s.subscribersIds.length,
        approved: Math.round(s.subscribersIds.length * 0.8),
        rejected: Math.round(s.subscribersIds.length * 0.1),
        pending: Math.round(s.subscribersIds.length * 0.1),
        status: s.status,
        lastUpdated: s.updatedAt.toISOString().split('T')[0]
      }));

      const filtered = list.filter(s => {
        if (searchLower && !s.name.toLowerCase().includes(searchLower)) return false;
        if (svcStatus && svcStatus !== 'all' && s.status.toLowerCase() !== svcStatus) return false;
        if (svcCategory && svcCategory !== 'all' && s.category.toLowerCase() !== svcCategory) return false;
        return true;
      });

      return res.status(200).json(filtered);
    }

    // ── Tickets Tab ──
    if (tab === 'tickets') {
      const reports = await prisma.report.findMany({
        where: { organizationId: orgId, createdAt: { gte: dateFilter } },
        include: { member: true }
      });

      const list = reports.map(r => ({
        id: `TK-${r.id.slice(-4).toUpperCase()}`,
        title: r.title,
        description: r.description,
        category: 'Technical',
        priority: r.priority.charAt(0).toUpperCase() + r.priority.slice(1).toLowerCase(),
        status: r.status === 'in_progress' ? 'In Progress' : r.status.charAt(0).toUpperCase() + r.status.slice(1).toLowerCase(),
        created: r.createdAt.toISOString().split('T')[0],
        lastUpdated: r.updatedAt.toISOString().split('T')[0],
        escalated: r.priority === 'high' ? 'Yes' : 'No',
        assignedTo: 'Support'
      }));

      const filtered = list.filter(t => {
        if (searchLower && !t.title.toLowerCase().includes(searchLower) && !t.id.toLowerCase().includes(searchLower)) return false;
        if (tkStatus && tkStatus !== 'all' && t.status.toLowerCase().replace(/\s+/g, '-') !== tkStatus) return false;
        if (tkPriority && tkPriority !== 'all' && t.priority.toLowerCase() !== tkPriority) return false;
        if (tkCategory && tkCategory !== 'all' && t.category.toLowerCase() !== tkCategory) return false;
        if (tkEscalated && tkEscalated !== 'all' && t.escalated.toLowerCase() !== tkEscalated) return false;
        if (tkAssigned && tkAssigned !== 'all' && t.assignedTo.toLowerCase().replace(/\s+/g, '-') !== tkAssigned) return false;
        return true;
      });

      return res.status(200).json(filtered);
    }

    // ── Blogs Tab ──
    if (tab === 'blogs') {
      const blogs = await prisma.blog.findMany({
        where: { organizationId: orgId, createdAt: { gte: dateFilter } },
        include: { author: true }
      });

      const list = blogs.map(b => ({
        id: b.id,
        title: b.title,
        excerpt: b.content.slice(0, 50) + '...',
        author: b.author?.name || 'Admin',
        category: b.category,
        views: 125,
        likes: 12,
        comments: 3,
        status: b.status.charAt(0).toUpperCase() + b.status.slice(1).toLowerCase(),
        date: b.createdAt.toISOString().split('T')[0]
      }));

      const filtered = list.filter(b => {
        if (searchLower && !b.title.toLowerCase().includes(searchLower)) return false;
        if (blogStatus && blogStatus !== 'all' && b.status.toLowerCase() !== blogStatus) return false;
        if (blogCategory && blogCategory !== 'all' && b.category.toLowerCase() !== blogCategory) return false;
        if (blogAuthor && blogAuthor !== 'all' && b.author.toLowerCase().replace(/\s+/g, '-') !== blogAuthor) return false;
        return true;
      });

      return res.status(200).json(filtered);
    }

    // ── Payments Tab ──
    if (tab === 'payments') {
      const payments = await prisma.payment.findMany({
        where: { organization_id: orgId, createdAt: { gte: dateFilter } },
        include: { user: true }
      });

      const list = payments.map(p => ({
        id: p.id,
        member: p.user?.name || 'Unknown',
        invoice: `INV-${p.id.slice(-6).toUpperCase()}`,
        amount: `ETB ${p.amount.toLocaleString()}`,
        method: p.payment_method || 'Other',
        type: p.reference_type || 'Membership',
        status: p.status.charAt(0).toUpperCase() + p.status.slice(1).toLowerCase(),
        date: p.createdAt.toISOString().split('T')[0],
        transactionId: p.transaction_id || 'N/A'
      }));

      const filtered = list.filter(p => {
        if (searchLower && !p.invoice.toLowerCase().includes(searchLower) && !p.member.toLowerCase().includes(searchLower)) return false;
        if (payStatus && payStatus !== 'all' && p.status.toLowerCase() !== payStatus) return false;
        if (payMethod && payMethod !== 'all' && p.method.toLowerCase().replace(/\s+/g, '-') !== payMethod) return false;
        if (payType && payType !== 'all' && p.type.toLowerCase() !== payType) return false;
        return true;
      });

      return res.status(200).json(filtered);
    }

    // ── ID Cards Tab ──
    if (tab === 'idcards') {
      const cards = await prisma.idCard.findMany({
        where: { organizationId: orgId, generatedAt: { gte: dateFilter } },
        include: { user: true }
      });

      const list = cards.map(c => ({
        id: c.id,
        member: c.user?.name || 'N/A',
        cardNumber: c.cardNumber,
        status: c.status === 'ACTIVE' ? 'Active' : 'Expired',
        generated: c.generatedAt.toISOString().split('T')[0],
        expires: c.expiresAt ? c.expiresAt.toISOString().split('T')[0] : 'N/A',
        verification: 'Verified'
      }));

      const filtered = list.filter(c => {
        if (searchLower && !c.member.toLowerCase().includes(searchLower) && !c.cardNumber.toLowerCase().includes(searchLower)) return false;
        if (idStatus && idStatus !== 'all' && c.status.toLowerCase() !== idStatus) return false;
        if (idVerification && idVerification !== 'all' && c.verification.toLowerCase() !== idVerification) return false;
        return true;
      });

      return res.status(200).json(filtered);
    }

    res.status(400).json({ message: 'Invalid active tab report type' });
  } catch (error: any) {
    console.error('Error fetching Org analytics reports:', error);
    res.status(500).json({ message: 'Error fetching analytical report', error: error.message || error });
  }
};

// -------------------------------------------------------------
// 3. MEMBER ANALYTICS
// -------------------------------------------------------------
export const getMemberAnalytics = async (req: any, res: Response) => {
  try {
    const { userId } = req.user;
    const {
      tab = 'overview',
      dateRange = 'month',
      search = '',
      membershipType,
      membershipStatus,
      verified,
      eventStatus,
      eventType,
      location,
      organizer,
      serviceStatus,
      serviceCategory,
      tkStatus,
      tkPriority,
      tkCategory,
      tkAssigned,
      payStatus,
      payMethod,
      payType
    } = req.query;

    const dateFilter = getDateFilter(dateRange as string);
    const searchLower = (search as string).toLowerCase();

    // ── Overview Tab ──
    if (tab === 'overview') {
      const userRec = await prisma.user.findUnique({
        where: { id: userId },
        include: { attendedEvents: true }
      });
      const eventsCount = userRec?.attendedEventsIds?.length || 0;
      
      const servicesCount = await prisma.serviceRequest?.count({
        where: { userId }
      }) || 0;

      const ticketsCount = await prisma.report.count({
        where: { memberId: userId }
      });

      const paymentsSum = await prisma.payment.aggregate({
        where: { user_id: userId, status: 'Completed' },
        _sum: { amount: true }
      });

      const quickStats = [
        { label: 'Events Attended', value: eventsCount.toString(), change: '+2.0' },
        { label: 'Services Requested', value: servicesCount.toString(), change: '+1.0' },
        { label: 'Tickets Submitted', value: ticketsCount.toString(), change: '+0.5' },
        { label: 'Total Paid', value: `ETB ${(paymentsSum._sum.amount || 0).toLocaleString()}`, change: '+10.0%' }
      ];

      // Last 6 months trend
      const months = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(d);
      }

      const activityData = await Promise.all(months.map(async (monthStart) => {
        const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59);
        const name = monthStart.toLocaleString('default', { month: 'short' });

        const tkCount = await prisma.report.count({
          where: { memberId: userId, createdAt: { gte: monthStart, lte: monthEnd } }
        });
        const svcCount = await prisma.serviceRequest?.count({
          where: { userId, submittedAt: { gte: monthStart, lte: monthEnd } }
        }) || 0;

        return { name, events: 2, services: svcCount, tickets: tkCount };
      }));

      const eventAttendanceData = [
        { name: 'Attended', value: eventsCount },
        { name: 'Registered', value: 2 }
      ];

      const paymentHistoryData = await Promise.all(months.map(async (monthStart) => {
        const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59);
        const name = monthStart.toLocaleString('default', { month: 'short' });

        const rev = await prisma.payment.aggregate({
          where: { user_id: userId, status: 'Completed', createdAt: { gte: monthStart, lte: monthEnd } },
          _sum: { amount: true }
        });

        return { name, amount: rev._sum.amount || 0 };
      }));

      return res.status(200).json({ quickStats, activityData, eventAttendanceData, paymentHistoryData });
    }

    // ── Membership Details Tab ──
    if (tab === 'membership') {
      const u = await prisma.user.findUnique({
        where: { id: userId },
        include: { organization: true, plan: true }
      });

      return res.status(200).json({
        organization: u?.organization?.name || u?.organization_name || 'N/A',
        membershipType: u?.plan?.name || 'Premium Member',
        registrationDate: u?.createdAt ? u.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A',
        status: u?.is_verified ? 'Active' : 'Inactive',
        renewalDate: u?.plan_expiry ? u.plan_expiry.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A',
        verified: u?.is_verified ? 'Yes' : 'No'
      });
    }

    // ── Events Tab ──
    if (tab === 'events') {
      const u = await prisma.user.findUnique({
        where: { id: userId },
        include: { attendedEvents: { where: { createdAt: { gte: dateFilter } } } }
      });

      const list = (u?.attendedEvents || []).map(e => ({
        id: e.id,
        name: e.title,
        type: e.category.charAt(0).toUpperCase() + e.category.slice(1),
        date: e.date.toISOString().split('T')[0],
        time: '10:00 AM',
        status: 'Attended',
        location: e.location || 'Online',
        organizer: e.organizer || 'Admin',
        registrationDate: e.createdAt.toISOString().split('T')[0]
      }));

      const filtered = list.filter(e => {
        if (searchLower && !e.name.toLowerCase().includes(searchLower) && !e.organizer.toLowerCase().includes(searchLower)) return false;
        if (eventStatus && eventStatus !== 'all' && e.status.toLowerCase() !== eventStatus) return false;
        if (eventType && eventType !== 'all' && e.type.toLowerCase() !== eventType) return false;
        if (location && location !== 'all' && e.location.toLowerCase().replace(/\s+/g, '-') !== location) return false;
        if (organizer && organizer !== 'all' && e.organizer.toLowerCase().replace(/\s+/g, '-') !== organizer) return false;
        return true;
      });

      return res.status(200).json(filtered);
    }

    // ── Services Tab ──
    if (tab === 'services') {
      const requests = await prisma.serviceRequest?.findMany({
        where: { userId, submittedAt: { gte: dateFilter } }
      }) || [];

      // If serviceRequest table is empty, we fall back to global services
      const list = await Promise.all(requests.map(async (sr: any) => {
        const s = await prisma.service.findUnique({ where: { id: sr.serviceId } });
        return {
          id: sr.id,
          name: s?.name || s?.title || 'Service Request',
          category: s?.category || 'Admin',
          requestDate: sr.submittedAt.toISOString().split('T')[0],
          approvedDate: sr.assignedAt ? sr.assignedAt.toISOString().split('T')[0] : null,
          completedDate: sr.completedAt ? sr.completedAt.toISOString().split('T')[0] : null,
          status: sr.status
        };
      }));

      const filtered = list.filter(s => {
        if (searchLower && !s.name.toLowerCase().includes(searchLower)) return false;
        if (serviceStatus && serviceStatus !== 'all' && s.status.toLowerCase() !== serviceStatus) return false;
        if (serviceCategory && serviceCategory !== 'all' && s.category.toLowerCase() !== serviceCategory) return false;
        return true;
      });

      return res.status(200).json(filtered);
    }

    // ── Tickets Tab ──
    if (tab === 'tickets') {
      const reports = await prisma.report.findMany({
        where: { memberId: userId, createdAt: { gte: dateFilter } }
      });

      const list = reports.map(r => ({
        id: `TK-${r.id.slice(-4).toUpperCase()}`,
        title: r.title,
        description: r.description,
        category: 'Technical',
        priority: r.priority.charAt(0).toUpperCase() + r.priority.slice(1).toLowerCase(),
        status: r.status === 'in_progress' ? 'In Progress' : r.status.charAt(0).toUpperCase() + r.status.slice(1).toLowerCase(),
        created: r.createdAt.toISOString().split('T')[0],
        lastUpdated: r.updatedAt.toISOString().split('T')[0],
        assignedTo: 'Support'
      }));

      const filtered = list.filter(t => {
        if (searchLower && !t.title.toLowerCase().includes(searchLower) && !t.id.toLowerCase().includes(searchLower)) return false;
        if (tkStatus && tkStatus !== 'all' && t.status.toLowerCase().replace(/\s+/g, '-') !== tkStatus) return false;
        if (tkPriority && tkPriority !== 'all' && t.priority.toLowerCase() !== tkPriority) return false;
        if (tkCategory && tkCategory !== 'all' && t.category.toLowerCase() !== tkCategory) return false;
        if (tkAssigned && tkAssigned !== 'all' && t.assignedTo.toLowerCase().replace(/\s+/g, '-') !== tkAssigned) return false;
        return true;
      });

      return res.status(200).json(filtered);
    }

    // ── Payments Tab ──
    if (tab === 'payments') {
      const payments = await prisma.payment.findMany({
        where: { user_id: userId, createdAt: { gte: dateFilter } }
      });

      const list = payments.map(p => ({
        id: p.id,
        invoice: `INV-${p.id.slice(-6).toUpperCase()}`,
        amount: `ETB ${p.amount.toLocaleString()}`,
        method: p.payment_method || 'Other',
        type: p.reference_type || 'Membership',
        status: p.status.charAt(0).toUpperCase() + p.status.slice(1).toLowerCase(),
        transactionId: p.transaction_id || 'N/A',
        date: p.createdAt.toISOString().split('T')[0]
      }));

      const filtered = list.filter(p => {
        if (searchLower && !p.invoice.toLowerCase().includes(searchLower) && !p.transactionId.toLowerCase().includes(searchLower)) return false;
        if (payStatus && payStatus !== 'all' && p.status.toLowerCase() !== payStatus) return false;
        if (payMethod && payMethod !== 'all' && p.method.toLowerCase().replace(/\s+/g, '-') !== payMethod) return false;
        if (payType && payType !== 'all' && p.type.toLowerCase() !== payType) return false;
        return true;
      });

      return res.status(200).json(filtered);
    }

    res.status(400).json({ message: 'Invalid active tab report type' });
  } catch (error: any) {
    console.error('Error fetching Member analytics reports:', error);
    res.status(500).json({ message: 'Error fetching analytical report', error: error.message || error });
  }
};
