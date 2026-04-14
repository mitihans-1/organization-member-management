import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ where: { role: 'orgAdmin' } });
  if (users.length === 0) {
    console.log("No users found");
    return;
  }
  const user = users[0];
  console.log("Testing with User:", user.id, user.email, "Org ID:", user.organizationId);
  
  if (!user.organizationId) {
      console.log("No organizationId on user, cannot test createAttributeDefinition correctly.");
      return;
  }

  try {
    const definition = await prisma.customAttributeDefinition.create({
      data: {
        name: 'Test Attribute ' + Date.now(),
        type: 'text',
        required: false,
        organizationId: user.organizationId,
      },
    });
    console.log('Successfully created:', definition);
  } catch (err: any) {
    console.error('Error in createAttributeDefinition:', err.message);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
