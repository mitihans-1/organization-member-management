import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { sendEventReminderEmail } from './emailService';

const prisma = new PrismaClient();

export const startCronJobs = () => {
  // Run every day at 9 AM
  cron.schedule('0 9 * * *', async () => {
    try {
      console.log('Running event reminder cron job...');
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      // Find all events happening tomorrow
      const events = await prisma.event.findMany({
        where: {
          date: {
            gte: tomorrow,
            lt: dayAfterTomorrow
          }
        },
        include: {
          organizations: true,
          attendees: true
        }
      });

      for (const event of events) {
        // Get all attendees
        const attendeeEmails = new Set<string>();
        
        for (const attendee of event.attendees) {
          if (attendee.email) {
            attendeeEmails.add(attendee.email);
          }
        }

        // Send reminder to each attendee
        for (const email of attendeeEmails) {
          const user = await prisma.user.findUnique({ where: { email } });
          if (user) {
            await sendEventReminderEmail(
              email,
              user.name,
              event.title,
              event.date,
              event.location || '',
              event.id
            );
          }
        }
      }

      console.log(`Event reminder cron job completed. Processed ${events.length} events.`);
    } catch (error) {
      console.error('Error running event reminder cron job:', error);
    }
  });

  console.log('Cron jobs started successfully.');
};
