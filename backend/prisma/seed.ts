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
      },
    });
  } else {
    await prisma.user.create({
      data: {
        name: 'Platform Owner',
        email: superEmail,
        password: superPasswordHash,
        role: 'SuperAdmin',
      },
    });
  }
  console.log('SuperAdmin ready:', superEmail, '(password from SEED_SUPERADMIN_PASSWORD)');

  /** Default subscription plans for org upgrade / Payments UI (idempotent: creates any that are missing by name). */
  const defaultPlans = [
    { name: 'Basic', price: 0, billing_cycle: 'monthly', type: 'Standard', max_members: 10, duration_days: 30 },
    { name: 'Pro', price: 25, billing_cycle: 'monthly', type: 'Premium', max_members: 50, duration_days: 30 },
    {
      name: 'Enterprise',
      price: 100,
      billing_cycle: 'yearly',
      type: 'Elite',
      max_members: 500,
      duration_days: 365,
    },
  ] as const;

  for (const plan of defaultPlans) {
    const existing = await prisma.plan.findFirst({ where: { name: plan.name } });
    if (!existing) {
      await prisma.plan.create({ data: { ...plan } });
      console.log('Plan created:', plan.name);
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
      data: { name: orgName, type: orgType },
    });
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
          author_id: user.id,
          organizationId: demoOrg.id,
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
        description:
          'Full-day session on strategy, networking, and product updates for leaders and member coordinators.',
        location: 'Community Center, Main Hall',
        daysFromNow: 14,
        image: '/asset/eventmanagementpowerpointpresentationslides-210810034621-thumbnail.webp',
      },
      {
        title: 'Workshop: Member onboarding best practices',
        description: 'Hands-on session for admins—templates, checklists, and follow-up workflows.',
        location: 'Online (video link)',
        daysFromNow: 21,
        image: null,
      },
      {
        title: 'Regional chapter meetup',
        description: 'Informal networking for members in your area—light agenda, Q&A, and refreshments.',
        location: 'Downtown Hub',
        daysFromNow: 30,
        image: null,
      },
      {
        title: 'Board & finance briefing',
        description: 'Quarterly review for treasurers and board members: dues, reserves, and reporting.',
        location: 'Head office',
        daysFromNow: 45,
        image: null,
      },
      {
        title: 'Volunteer appreciation evening',
        description: 'Celebrate the people who run events and programs—short awards and social time.',
        location: 'Riverside venue',
        daysFromNow: 60,
        image: null,
      },
      {
        title: 'New member orientation',
        description: 'Intro to benefits, portal walkthrough, and how to get involved in committees.',
        location: 'Online + in-person hybrid',
        daysFromNow: 10,
        image: null,
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
        },
      });
    }
    console.log('Sample events seeded');
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
