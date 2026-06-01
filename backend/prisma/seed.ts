import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v?.trim()) {
    throw new Error(
      `Missing ${name}. Add it to backend/.env (see .env.example). Required to run prisma seed.`,
    );
  }
  return v.trim();
}

async function main() {


  const superEmail =
    process.env.SEED_SUPERADMIN_EMAIL?.trim() || 'owner@omms.com';
  const superPassword = requireEnv('SEED_SUPERADMIN_PASSWORD');
  const superPasswordHash = await bcrypt.hash(superPassword, 10);

  let superUser = await prisma.user.findUnique({ where: { email: superEmail } });
  if (superUser) {
    await prisma.user.update({
      where: { email: superEmail },
      data: {
        password: superPasswordHash,
        role: 'SuperAdmin',
        is_verified: true,
      },
    });
  } else {
    await prisma.user.create({
      data: {
        name: 'Platform Owner',
        email: superEmail,
        password: superPasswordHash,
        role: 'SuperAdmin',
        is_verified: true,
      },
    });
  }
  console.log('SuperAdmin ready:', superEmail, '(password from SEED_SUPERADMIN_PASSWORD)');

  // Default features (same as in controllers)
  const defaultFeatures = {
    free: ['overview', 'members', 'contact', 'subscriptions', 'payments', 'profile'],
    pro: ['overview', 'members', 'events', 'services', 'news', 'chat', 'contact', 'subscriptions', 'payments', 'profile'],
    enterprise: ['overview', 'members', 'events', 'services', 'news', 'chat', 'contact', 'subscriptions', 'payments', 'reports', 'id-cards', 'licenses', 'profile'],
  };

  /** Default subscription plans for org upgrade / Payments UI (idempotent: creates any that are missing by name). */
  const defaultPlans = [
    { name: 'Free', price: 0, billing_cycle: 'monthly', type: 'Standard', max_members: 10, duration_days: 30, allowed_features: defaultFeatures.free },
    { name: 'Pro', price: 25, billing_cycle: 'monthly', type: 'Premium', max_members: 50, duration_days: 30, allowed_features: defaultFeatures.pro },
    {
      name: 'Enterprise',
      price: 100,
      billing_cycle: 'yearly',
      type: 'Elite',
      max_members: 500,
      duration_days: 365,
      allowed_features: defaultFeatures.enterprise,
    },
  ] as const;

  let freePlan: any = null;
  for (const plan of defaultPlans) {
    const existing = await prisma.plan.findFirst({ where: { name: plan.name } });
    if (!existing) {
      const createdPlan = await prisma.plan.create({ data: plan as any });
      console.log('Plan created:', plan.name);
      if (plan.name === 'Free') {
        freePlan = createdPlan;
      }
    } else {
      if (plan.name === 'Free') {
        freePlan = existing;
      }
      // Update existing plan's features
      await prisma.plan.update({
        where: { id: existing.id },
        // @ts-ignore: Prisma client needs regeneration in progress
        data: { allowed_features: plan.allowed_features as any },
      });
    }
  }
  const planTotal = await prisma.plan.count();
  console.log('Plans in database:', planTotal, `(${defaultPlans.map((p) => p.name).join(', ')})`);

  const demoEmail =
    process.env.SEED_DEMO_ORG_ADMIN_EMAIL?.trim() ||
    'admin@membershippro.demo';
  const demoPassword = requireEnv('SEED_DEMO_ORG_ADMIN_PASSWORD');
  const hashedPassword = await bcrypt.hash(demoPassword, 10);

  const orgName = 'MemberShip Pro Demo';
  const orgType = 'Membership organization';
  let demoOrg = await prisma.organization.findFirst({ where: { name: orgName } });
  if (!demoOrg) {
    demoOrg = await prisma.organization.create({
      data: { name: orgName, type: orgType, plan_id: freePlan.id },
    });
    console.log('Demo org created with Free plan');
  } else if (!demoOrg.plan_id) {
    // Assign free plan to existing demo org if it doesn't have one
    demoOrg = await prisma.organization.update({
      where: { id: demoOrg.id },
      data: { plan_id: freePlan.id },
    });
    console.log('Demo org updated to use Free plan');
  }

  let user = await prisma.user.findUnique({ where: { email: demoEmail } });
  if (user) {
    user = await prisma.user.update({
      where: { email: demoEmail },
      data: {
        password: hashedPassword,
        organizationId: demoOrg.id,
        organization_name: demoOrg.name,
        organization_type: demoOrg.type,
        role: 'orgAdmin',
        is_verified: true,
      },
    });
  } else {
    user = await prisma.user.create({
      data: {
        name: 'Demo Admin',
        email: demoEmail,
        password: hashedPassword,
        role: 'orgAdmin',
        organizationId: demoOrg.id,
        organization_name: demoOrg.name,
        organization_type: demoOrg.type,
        is_verified: true,
      },
    });
  }

  const notifCount = await prisma.notification.count({
    where: { userId: user.id }
  });
  if (notifCount === 0) {
    await prisma.notification.createMany({
      data: [
        { userId: user.id, title: 'New member registration pending review', read: false },
        { userId: user.id, title: 'Event "Annual Member Summit" is in 2 weeks', read: false },
        { userId: user.id, title: 'Payment received for Pro plan', read: true },
      ]
    });
    console.log('Sample notifications seeded for demo org admin');
  }

  const blogCount = await prisma.blog.count();
  if (blogCount === 0) {
    const samples = [
      {
        title: 'Growing member engagement in 2026',
        content:
          'Practical ways to keep members active: clear communication, segmented campaigns, and measuring what matters for your organization.',
        image: '/asset/images-for-blogs.jpeg',
      },
      {
        title: 'Renewing memberships without the churn',
        content:
          'Automate reminders, offer flexible plans, and show value year-round so your community stays subscribed.',
        image: null,
      },
      {
        title: 'Reporting that your board actually reads',
        content:
          'From attendance to revenue, export the metrics stakeholders care about—without spreadsheets everywhere.',
        image: null,
      },
      {
        title: 'Events that drive retention',
        content:
          'Workshops, networking, and annual meetings: how to plan, promote, and follow up using one system.',
        image: null,
      },
      {
        title: 'Onboarding new members in their first 30 days',
        content:
          'A simple checklist: welcome email, profile completion, first event invite, and feedback loop.',
        image: null,
      },
      {
        title: 'Payments and compliance for member orgs',
        content:
          'Staying aligned with receipts, refunds, and audit-friendly records while keeping checkout simple.',
        image: null,
      },
    ];

    for (const b of samples) {
      await prisma.blog.create({
        data: {
          title: b.title,
          content: b.content,
          image: b.image,
          status: 'published',
          author_id: user.id,
          organizationId: demoOrg.id,
          isPredefined: false,
        },
      });
    }
    console.log('Sample blogs seeded');
  }

  const eventCount = await prisma.event.count();
  if (eventCount === 0) {
    const base = Date.now();
    const samples = [
      {
        title: 'Annual Member Summit',
        description: 'Full-day session on strategy, networking, and product updates for leaders and member coordinators.',
        location: 'Online (Zoom)',
        daysFromNow: 14,
        image: '/asset/eventmanagementpowerpointpresentationslides-210810034621-thumbnail.webp',
        organizer: 'Events Team',
        status: 'upcoming',
        category: 'general',
        contactEmail: 'events@demo-org.local',
      },
      {
        title: 'Workshop: Member onboarding best practices',
        description: 'Hands-on session for admins—templates, checklists, and follow-up workflows.',
        location: 'Online (video link)',
        daysFromNow: 21,
        image: null,
        organizer: 'Training Team',
        status: 'upcoming',
        category: 'workshop',
        contactEmail: 'training@demo-org.local',
      },
      {
        title: 'Regional chapter meetup',
        description: 'Informal networking for members in your area—light agenda, Q&A.',
        location: 'Online (Google Meet)',
        daysFromNow: 30,
        image: null,
        organizer: 'Regional Coordinators',
        status: 'upcoming',
        category: 'networking',
      },
      {
        title: 'Board & finance briefing',
        description: 'Quarterly review for treasurers and board members: dues, reserves, and reporting.',
        location: 'Online (Microsoft Teams)',
        daysFromNow: 45,
        image: null,
        organizer: 'Finance Committee',
        status: 'draft',
        category: 'seminar',
      },
      {
        title: 'New member orientation',
        description: 'Intro to benefits, portal walkthrough, and how to get involved in committees.',
        location: 'Online (video link)',
        daysFromNow: 10,
        image: null,
        organizer: 'Membership Team',
        status: 'ongoing',
        category: 'virtual',
        contactEmail: 'membership@demo-org.local',
      },
      {
        title: 'Tech Conference 2026',
        description: 'Latest trends in AI, cloud computing, and software development.',
        location: 'Online (Zoom)',
        daysFromNow: 40,
        image: null,
        organizer: 'Tech Committee',
        status: 'upcoming',
        category: 'conference',
        contactEmail: 'tech@demo-org.local',
        payment_required: true,
        price: 299,
      },
      {
        title: 'Startup Pitch Competition',
        description: 'Compete for prizes and mentorship opportunities.',
        location: 'Online (Google Meet)',
        daysFromNow: 50,
        image: null,
        organizer: 'Entrepreneur Network',
        status: 'upcoming',
        category: 'competition',
        contactEmail: 'startup@demo-org.local',
      },
      {
        title: 'Coding Bootcamp Info Session',
        description: 'Learn about our upcoming coding bootcamp.',
        location: 'Online (Zoom)',
        daysFromNow: 15,
        image: null,
        organizer: 'Education Team',
        status: 'upcoming',
        category: 'info-session',
        contactEmail: 'edu@demo-org.local',
      },
      {
        title: 'Career Fair',
        description: 'Connect with employers and explore job opportunities.',
        location: 'Online (Microsoft Teams)',
        daysFromNow: 55,
        image: null,
        organizer: 'Career Services',
        status: 'upcoming',
        category: 'career',
        contactEmail: 'career@demo-org.local',
      },
      {
        title: 'Public Speaking Masterclass',
        description: 'Improve your presentation skills.',
        location: 'Online (Google Meet)',
        daysFromNow: 32,
        image: null,
        organizer: 'Communication Club',
        status: 'upcoming',
        category: 'workshop',
        contactEmail: 'comm@demo-org.local',
        payment_required: true,
        price: 125,
      },
    ];

    for (const e of samples) {
      await prisma.event.create({
        data: {
          title: e.title,
          description: e.description,
          location: e.location,
          date: new Date(base + e.daysFromNow * 86400000),
          image: e.image,
          organizationId: demoOrg.id,
          isPredefined: false,
          organizer: e.organizer,
          status: e.status,
          category: e.category,
          contactEmail: e.contactEmail ?? null,
        },
      });
    }
    console.log('Sample events seeded');
  }

  const platformEventTarget = 10;
  const platformEventCount = await prisma.event.count({ where: { isPredefined: true } });
  if (platformEventCount < platformEventTarget) {
    const base = Date.now();
    const platformEvents = [
      {
        title: 'OMMS Platform Launch Webinar',
        description: 'Join the OMMS team for a live walkthrough of the platform. Learn how member management, events, services, and payments work together — and ask questions live.',
        location: 'Online (Zoom)',
        daysFromNow: 7,
        status: 'upcoming',
        category: 'virtual',
        organizer: 'OMMS Team',
        contactEmail: 'hello@omms.io',
      },
      {
        title: 'Best Practices for Member Organizations — Admin Workshop',
        description: 'A hands-on workshop for org admins exploring advanced OMMS features: bulk member imports, custom subscription tiers, event automation, and report exports.',
        location: 'Online (Google Meet)',
        daysFromNow: 21,
        status: 'upcoming',
        category: 'workshop',
        organizer: 'OMMS Platform Success',
        contactEmail: 'success@omms.io',
      },
      {
        title: 'OMMS Community Networking Summit',
        description: 'Connect with org admins and member coordinators from across the OMMS network. Share experiences, swap strategies, and hear from organizations that have scaled from 50 to 5,000 members.',
        location: 'Hybrid — Grand Conference Center & Online',
        daysFromNow: 35,
        status: 'upcoming',
        category: 'networking',
        organizer: 'OMMS Community Team',
        contactEmail: 'community@omms.io',
      },
      {
        title: 'Digital ID Cards Deep Dive',
        description: 'A focused session on issuing, customizing, and revoking digital member ID cards. Learn QR code verification, bulk issuance, and how to integrate card workflows with membership renewals.',
        location: 'Online (Zoom)',
        daysFromNow: 14,
        status: 'upcoming',
        category: 'workshop',
        organizer: 'OMMS Product Team',
      },
      {
        title: 'Payments & Subscriptions Masterclass',
        description: 'Everything your finance team needs to know: billing cycles, plan migrations, receipt generation, refund workflows, and audit-ready reporting — all inside OMMS.',
        location: 'Online',
        daysFromNow: 28,
        status: 'upcoming',
        category: 'seminar',
        organizer: 'OMMS Finance Team',
        contactEmail: 'finance@omms.io',
      },
      {
        title: 'OMMS Annual Partner Conference',
        description: 'Our flagship annual event bringing together partner organizations, enterprise clients, and the OMMS core team. Keynotes, product roadmap reveal, breakout workshops, and a networking dinner.',
        location: 'International Convention Center, Main Hall',
        daysFromNow: 90,
        status: 'upcoming',
        category: 'conference',
        organizer: 'OMMS Executive Team',
        contactEmail: 'conference@omms.io',
        payment_required: true,
        price: 499,
      },
      {
        title: 'OMMS Hackathon',
        description: 'Build integrations and customizations for OMMS. Win prizes and recognition!',
        location: 'Online',
        daysFromNow: 55,
        status: 'upcoming',
        category: 'competition',
        organizer: 'OMMS Engineering Team',
        contactEmail: 'hackathon@omms.io',
      },
      {
        title: 'OMMS User Group: EMEA',
        description: 'Regional meetup for OMMS users in Europe, Middle East, and Africa.',
        location: 'London, UK',
        daysFromNow: 45,
        status: 'upcoming',
        category: 'regional',
        organizer: 'OMMS EMEA Team',
        contactEmail: 'emea@omms.io',
      },
      {
        title: 'OMMS User Group: APAC',
        description: 'Regional meetup for OMMS users in Asia Pacific.',
        location: 'Singapore',
        daysFromNow: 65,
        status: 'upcoming',
        category: 'regional',
        organizer: 'OMMS APAC Team',
        contactEmail: 'apac@omms.io',
      },
      {
        title: 'OMMS Security Best Practices',
        description: 'Learn about OMMS security features and best practices for keeping your data safe.',
        location: 'Online (Microsoft Teams)',
        daysFromNow: 38,
        status: 'upcoming',
        category: 'security',
        organizer: 'OMMS Security Team',
        contactEmail: 'security@omms.io',
      },
    ];

    const existingEvents = await prisma.event.findMany({ where: { isPredefined: true }, select: { title: true } });
    const existingEventTitles = new Set(existingEvents.map((e) => e.title));
    for (const e of platformEvents) {
      if (!existingEventTitles.has(e.title)) {
        await prisma.event.create({
          data: {
            title: e.title,
            description: e.description,
            location: e.location,
            date: new Date(base + e.daysFromNow * 86400000),
            isPredefined: true,
            organizationId: null,
            status: e.status,
            category: e.category,
            organizer: e.organizer,
            contactEmail: e.contactEmail ?? null,
          },
        });
      }
    }
    console.log('Platform predefined events seeded');
  }

  const serviceCount = await prisma.service.count();
  if (serviceCount === 0) {
    const predefinedServices = [
      {
        title: 'Community Tools',
        description: 'Access to community engagement tools including forums, polls, and discussion boards to foster member interaction.',
        category: 'general',
        status: 'Active',
        owner: 'Platform Admin',
        department: 'Community Management',
        duration: 'Ongoing',
        slaHours: 48,
        code: 'SVC-COMM-001',
        renewalRule: 'Annual',
        isPredefined: true,
      },
      {
        title: 'Member Directory',
        description: 'Searchable directory of all organization members with contact information and profiles for networking.',
        category: 'support',
        status: 'Active',
        owner: 'Sarah Chen',
        department: 'Member Services',
        duration: 'Ongoing',
        slaHours: 24,
        code: 'SVC-DIR-002',
        renewalRule: 'None',
        isPredefined: true,
      },
      {
        title: 'Document Library',
        description: 'Secure storage and sharing of important documents, templates, and resources for organization members.',
        category: 'training',
        status: 'Under Maintenance',
        owner: 'Mike Rodriguez',
        department: 'Knowledge Management',
        duration: 'Ongoing',
        slaHours: 72,
        code: 'SVC-DOC-003',
        renewalRule: 'Quarterly',
        isPredefined: true,
      },
      {
        title: 'Event Management',
        description: 'Complete event planning and management tools including registration, ticketing, and attendee tracking.',
        category: 'events',
        status: 'Active',
        owner: 'Emily Watson',
        department: 'Events Team',
        duration: 'Per event',
        slaHours: 24,
        code: 'SVC-EVT-004',
        renewalRule: 'None',
        isPredefined: true,
      },
      {
        title: 'Member Support',
        description: 'Dedicated support desk for member inquiries, technical issues, and general assistance.',
        category: 'support',
        status: 'Suspended',
        owner: 'David Kim',
        department: 'Customer Support',
        duration: '24/7',
        slaHours: 12,
        code: 'SVC-SUP-005',
        renewalRule: 'Monthly',
        isPredefined: true,
      },
      {
        title: 'Analytics Dashboard',
        description: 'Real-time analytics and reporting on member engagement, event attendance, and service usage.',
        category: 'analytics',
        status: 'Archived',
        owner: 'Lisa Patel',
        department: 'Analytics',
        duration: 'Ongoing',
        slaHours: 48,
        code: 'SVC-ANL-006',
        renewalRule: 'Annual',
        isPredefined: true,
      },
      {
        title: 'Certification Program',
        description: 'Professional certification courses and exams for members to enhance their skills.',
        category: 'training',
        status: 'Active',
        owner: 'Anna Martinez',
        department: 'Education',
        duration: '6 months',
        slaHours: 48,
        code: 'SVC-CERT-007',
        renewalRule: 'Annual',
        isPredefined: true,
      },
      {
        title: 'Legal Consultation',
        description: 'Access to legal experts for member-specific legal questions and document review.',
        category: 'legal',
        status: 'Active',
        owner: 'Robert Taylor',
        department: 'Legal',
        duration: 'Per consultation',
        slaHours: 96,
        code: 'SVC-LEGAL-008',
        renewalRule: 'None',
        isPredefined: true,
      },
      {
        title: 'Career Services',
        description: 'Job board, resume reviews, and career development workshops for members.',
        category: 'career',
        status: 'Active',
        owner: 'Jennifer Lee',
        department: 'Career Development',
        duration: 'Ongoing',
        slaHours: 72,
        code: 'SVC-CAREER-009',
        renewalRule: 'Monthly',
        isPredefined: true,
      },
      {
        title: 'Mentorship Program',
        description: 'One-on-one mentorship matching between experienced and new members.',
        category: 'mentorship',
        status: 'Active',
        owner: 'Amanda White',
        department: 'Community',
        duration: '6 months',
        slaHours: 48,
        code: 'SVC-MENTOR-010',
        renewalRule: 'Renewable',
        isPredefined: true,
      },
      {
        title: 'Marketing Toolkit',
        description: 'Templates, guides, and tools for members to promote their businesses or projects.',
        category: 'marketing',
        status: 'Active',
        owner: 'Chris Brown',
        department: 'Marketing',
        duration: 'Ongoing',
        slaHours: 72,
        code: 'SVC-MKT-011',
        renewalRule: 'Quarterly',
        isPredefined: true,
      },
      {
        title: 'Financial Advisory',
        description: 'Personal financial planning and investment advice for members.',
        category: 'financial',
        status: 'Active',
        owner: 'Nicole Garcia',
        department: 'Finance',
        duration: 'Per session',
        slaHours: 96,
        code: 'SVC-FIN-012',
        renewalRule: 'None',
        payment_required: true,
        price: 150,
        isPredefined: true,
      },
      {
        title: 'Tech Support',
        description: 'Technical assistance with software, hardware, and digital tools.',
        category: 'support',
        status: 'Active',
        owner: 'Kevin Thompson',
        department: 'Information Technology',
        duration: 'Ongoing',
        slaHours: 24,
        code: 'SVC-IT-013',
        renewalRule: 'Monthly',
        isPredefined: true,
      },
      {
        title: 'Language Courses',
        description: 'Online language learning courses in multiple languages.',
        category: 'training',
        status: 'Active',
        owner: 'Maria Gonzalez',
        department: 'Education',
        duration: '3 months',
        slaHours: 48,
        code: 'SVC-LANG-014',
        renewalRule: 'Renewable',
        payment_required: true,
        price: 800,
        isPredefined: true,
      },
      {
        title: 'Discount Program',
        description: 'Exclusive discounts on products and services from partner companies.',
        category: 'benefits',
        status: 'Active',
        owner: 'Ryan Jackson',
        department: 'Partnerships',
        duration: 'Ongoing',
        slaHours: 72,
        code: 'SVC-DISC-015',
        renewalRule: 'Annual',
        isPredefined: true,
      },
      {
        title: 'Research Database',
        description: 'Access to premium research papers, journals, and industry reports.',
        category: 'research',
        status: 'Active',
        owner: 'Sophie Martin',
        department: 'Knowledge Management',
        duration: 'Ongoing',
        slaHours: 48,
        code: 'SVC-RES-016',
        renewalRule: 'Monthly',
        payment_required: true,
        price: 50,
        isPredefined: true,
      },
      {
        title: 'Networking Events',
        description: 'Virtual and in-person networking events for members to connect.',
        category: 'networking',
        status: 'Active',
        owner: 'Daniel Clark',
        department: 'Community',
        duration: 'Monthly',
        slaHours: 24,
        code: 'SVC-NET-017',
        renewalRule: 'Monthly',
        isPredefined: true,
      },
      {
        title: 'Wellness Program',
        description: 'Mental health and wellness resources for members.',
        category: 'wellness',
        status: 'Active',
        owner: 'Dr. Sarah Miller',
        department: 'Wellness',
        duration: 'Weekly',
        slaHours: 24,
        code: 'SVC-WELL-018',
        renewalRule: 'Weekly',
        isPredefined: true,
      },
      {
        title: 'Startup Incubator',
        description: 'Support for entrepreneurs and startup founders.',
        category: 'entrepreneurship',
        status: 'Active',
        owner: 'Startup Coach',
        department: 'Innovation',
        duration: '6 months',
        slaHours: 72,
        code: 'SVC-INC-019',
        renewalRule: 'Bi-annual',
        payment_required: true,
        price: 500,
        isPredefined: true,
      },
      {
        title: 'Cybersecurity Training',
        description: 'Learn about online safety and data protection.',
        category: 'security',
        status: 'Under Maintenance',
        owner: 'Security Expert',
        department: 'IT Security',
        duration: '4 weeks',
        slaHours: 48,
        code: 'SVC-CYBER-020',
        renewalRule: 'Yearly',
        isPredefined: true,
      },
      {
        title: 'Public Speaking',
        description: 'Improve your communication and presentation skills.',
        category: 'communication',
        status: 'Active',
        owner: 'Speech Coach',
        department: 'Professional Development',
        duration: '8 weeks',
        slaHours: 36,
        code: 'SVC-SPEAK-021',
        renewalRule: 'Renewable',
        payment_required: true,
        price: 200,
        isPredefined: true,
      },
      {
        title: 'Freelance Marketplace',
        description: 'Connect with freelancers for your projects.',
        category: 'gig',
        status: 'Active',
        owner: 'Marketplace Manager',
        department: 'Operations',
        duration: 'Ongoing',
        slaHours: 48,
        code: 'SVC-FREELANCE-022',
        renewalRule: 'Annual',
        isPredefined: true,
      },
      {
        title: 'Web Development Bootcamp',
        description: 'Intensive coding program for beginners.',
        category: 'tech',
        status: 'Active',
        owner: 'Senior Developer',
        department: 'Engineering',
        duration: '12 weeks',
        slaHours: 24,
        code: 'SVC-DEV-023',
        renewalRule: 'None',
        payment_required: true,
        price: 1500,
        isPredefined: true,
      },
      {
        title: 'Investment Club',
        description: 'Group investing and financial literacy.',
        category: 'financial',
        status: 'Active',
        owner: 'Financial Analyst',
        department: 'Investments',
        duration: 'Monthly',
        slaHours: 48,
        code: 'SVC-INVEST-024',
        renewalRule: 'Monthly',
        payment_required: true,
        price: 30,
        isPredefined: true,
      },
      {
        title: 'Cloud Storage',
        description: 'Secure cloud storage for your files.',
        category: 'tech',
        status: 'Active',
        owner: 'Cloud Admin',
        department: 'Information Technology',
        duration: 'Annual',
        slaHours: 24,
        code: 'SVC-CLOUD-025',
        renewalRule: 'Annual',
        payment_required: true,
        price: 99,
        isPredefined: true,
      },
      {
        title: 'Resume Builder',
        description: 'Professional resume and cover letter templates.',
        category: 'career',
        status: 'Active',
        owner: 'Career Advisor',
        department: 'Career Services',
        duration: 'One-time',
        slaHours: 24,
        code: 'SVC-RESUME-026',
        renewalRule: 'One-time',
        isPredefined: true,
      },
      {
        title: 'Graphic Design Tools',
        description: 'Canva Pro and Adobe Creative Cloud discounts.',
        category: 'creative',
        status: 'Active',
        owner: 'Design Lead',
        department: 'Creative Services',
        duration: 'Monthly',
        slaHours: 48,
        code: 'SVC-DESIGN-027',
        renewalRule: 'Monthly',
        payment_required: true,
        price: 19,
        isPredefined: true,
      },
    ];

    for (const service of predefinedServices) {
      await prisma.service.create({
        data: {
          title: service.title,
          description: service.description,
          category: service.category,
          status: service.status,
          owner: service.owner,
          department: service.department,
          duration: service.duration,
          slaHours: service.slaHours,
          code: service.code,
          renewalRule: service.renewalRule,
          isPredefined: service.isPredefined,
        },
      });
    }
    console.log('Predefined platform services seeded');
  }

  console.log('Seed finished.');
  console.log('  SuperAdmin:', superEmail, '(SEED_SUPERADMIN_PASSWORD)');
  console.log('  Demo org admin:', demoEmail, '(SEED_DEMO_ORG_ADMIN_PASSWORD)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
