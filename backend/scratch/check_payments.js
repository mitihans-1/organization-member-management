
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const payments = await prisma.payment.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { email: true, name: true } },
      plan: { select: { name: true } }
    }
  });
  console.log(JSON.stringify(payments, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
