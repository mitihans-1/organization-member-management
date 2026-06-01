import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // First, get or create the Free plan
  let freePlan = await prisma.plan.findFirst({ where: { name: 'Free' } });
  if (!freePlan) {
    console.log('Free plan not found; creating it...');
    // @ts-ignore
    freePlan = await prisma.plan.create({
      data: {
        name: 'Free',
        price: 0,
        billing_cycle: 'monthly',
        type: 'Standard',
        max_members: 10,
        duration_days: 30,
        // @ts-ignore
        allowed_features: ['overview', 'members', 'contact', 'subscriptions', 'payments', 'profile'],
      },
    });
    console.log('Created Free plan:', freePlan.id);
  } else {
    console.log('Found Free plan:', freePlan.id);
  }

  // Now, find the organization "leli" by ID (we know the ID from the logs!)
  const orgId = '69f8789b7c63de55fbd5aba8';
  let org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) {
    console.log(`Organization with id ${orgId} not found!`);
    return;
  }
  console.log('Found organization:', org.name);

  // Assign the Free plan to this org!
  if (org.plan_id !== freePlan.id) {
    console.log('Assigning Free plan to organization...');
    await prisma.organization.update({
      where: { id: orgId },
      data: { plan_id: freePlan.id },
    });
    console.log('Successfully assigned Free plan!');
  } else {
    console.log('Organization already has Free plan!');
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error:', e);
    await prisma.$disconnect();
  });
