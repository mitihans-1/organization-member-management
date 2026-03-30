import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const planCount = await prisma.plan.count();
  if (planCount === 0) {
    const plans = [
      { name: 'Basic', price: 10.0, billing_cycle: 'monthly', type: 'Standard', max_members: 10, duration_days: 30 },
      { name: 'Pro', price: 25.0, billing_cycle: 'monthly', type: 'Premium', max_members: 50, duration_days: 30 },
      { name: 'Enterprise', price: 100.0, billing_cycle: 'yearly', type: 'Elite', max_members: 500, duration_days: 365 },
    ];
    for (const plan of plans) {
      await prisma.plan.create({ data: plan });
    }
    console.log('Plans seeded');
  }

  const demoEmail = 'admin@membershippro.demo';
  const hashedPassword = await bcrypt.hash('Demo123!', 10);

  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    create: {
      name: 'Demo Admin',
      email: demoEmail,
      password: hashedPassword,
      role: 'organAdmin',
      organization_name: 'MemberShip Pro Demo',
      organization_type: 'Membership organization',
    },
    update: {},
  });

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
        },
      });
    }
    console.log('Sample events seeded');
  }

  console.log('Seed finished. Demo login:', demoEmail, '/ Demo123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
