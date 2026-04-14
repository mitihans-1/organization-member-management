import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('Users:', users.map(u => ({ id: u.id, email: u.email, orgId: u.organizationId, orgName: u.organization_name })));

  const orgs = await prisma.organization.findMany();
  console.log('Orgs:', orgs.map(o => ({ id: o.id, name: o.name })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
