import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('Querying recent EmailNotificationLogs...');
  try {
    const logs = await prisma.emailNotificationLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 15
    });
    
    console.log('=== EMAIL LOGS ===');
    logs.forEach(log => {
      console.log(`ID: ${log.id}`);
      console.log(`To: ${log.to}`);
      console.log(`Subject: ${log.subject}`);
      console.log(`Type: ${log.type}`);
      console.log(`Status: ${log.status}`);
      console.log(`Error: ${log.error || 'None'}`);
      console.log(`Sent At: ${log.sentAt || 'N/A'}`);
      console.log(`Created At: ${log.createdAt}`);
      console.log('-----------------------------------');
    });
  } catch (error) {
    console.error('Error querying email logs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
