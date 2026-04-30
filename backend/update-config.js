const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Updating SystemConfig values...');
  const config = await prisma.systemConfig.findFirst();
  
  if (config) {
    // Access systemConfig via the internal _model map or bypass TS check
    await prisma['systemConfig'].update({
      where: { id: config.id },
      data: {
        telebirrPhone: '0911234567',
        cbeBirrPhone: '0911234568',
        contactHours: 'Mon - Fri: 8:00 AM - 5:00 PM',
      }
    });
    console.log('SystemConfig updated successfully with phone numbers and hours!');
  } else {
    console.log('No SystemConfig found to update.');
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
