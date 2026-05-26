
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { sendEventReminderEmail } from './emailService';
import { createInvoice } from './invoiceService';

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

  // Run every day at 8 AM for recurring billing
  cron.schedule('0 8 * * *', async () => {
    try {
      console.log('Running recurring billing cron job...');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Find active subscriptions where nextBillingDate is today or tomorrow
      const subscriptions = await prisma.memberSubscription.findMany({
        where: {
          status: 'active',
          autoRenew: true,
          nextBillingDate: {
            gte: today,
            lt: tomorrow,
          },
        },
        include: {
          plan: true,
          member: true,
          organization: true,
        },
      });

      console.log(`Found ${subscriptions.length} subscriptions to renew.`);

      for (const subscription of subscriptions) {
        // Generate new invoice
        const billingPeriodStart = subscription.nextBillingDate;
        const billingPeriodEnd = new Date(billingPeriodStart);
        billingPeriodEnd.setDate(billingPeriodEnd.getDate() + subscription.plan.durationDays);
        
        const dueDate = new Date(billingPeriodStart);
        dueDate.setDate(dueDate.getDate() + 7);

        await createInvoice({
          organizationId: subscription.organizationId,
          memberId: subscription.memberId,
          subscriptionId: subscription.id,
          planId: subscription.planId,
          planType: 'member',
          subtotal: subscription.plan.price,
          tax: 0,
          discount: 0,
          total: subscription.plan.price,
          dueDate,
          billingPeriodStart,
          billingPeriodEnd,
          isRecurring: true,
          notes: `${subscription.plan.name} - ${subscription.plan.billingCycle} subscription (auto-renewal)`,
          items: [
            {
              description: `${subscription.plan.name} Subscription`,
              quantity: 1,
              unitPrice: subscription.plan.price,
              total: subscription.plan.price,
            },
          ],
        });

        // Update subscription's nextBillingDate
        await prisma.memberSubscription.update({
          where: { id: subscription.id },
          data: {
            nextBillingDate: billingPeriodEnd,
          },
        });

        console.log(`Generated invoice for subscription ${subscription.id}`);
      }

      console.log('Recurring billing cron job completed.');
    } catch (error) {
      console.error('Error running recurring billing cron job:', error);
    }
  });

  // Run every day at 10 AM for overdue invoices
  cron.schedule('0 10 * * *', async () => {
    try {
      console.log('Running overdue invoices cron job...');
      
      const now = new Date();
      
      // Find overdue invoices (sent and due date is past)
      const overdueInvoices = await prisma.invoice.findMany({
        where: {
          status: 'sent',
          dueDate: { lt: now },
        },
        include: {
          subscription: true,
          organization: true,
          member: true,
        },
      });

      console.log(`Found ${overdueInvoices.length} overdue invoices.`);

      for (const invoice of overdueInvoices) {
        // Update invoice status to overdue
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { status: 'overdue' },
        });

        // If overdue for more than 30 days, pause subscription
        if (invoice.subscription) {
          const daysOverdue = Math.floor(
            (now.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysOverdue > 30) {
            await prisma.memberSubscription.update({
              where: { id: invoice.subscription.id },
              data: { status: 'paused' },
            });
            console.log(`Paused subscription ${invoice.subscription.id} due to overdue invoice.`);
          }
        }
      }

      console.log('Overdue invoices cron job completed.');
    } catch (error) {
      console.error('Error running overdue invoices cron job:', error);
    }
  });

  // Run every day at 8:30 AM for trial expiration reminders
  cron.schedule('30 8 * * *', async () => {
    try {
      console.log('Running trial expiration reminder cron job...');
      
      const today = new Date();
      const threeDaysFromNow = new Date(today);
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      
      // Find subscriptions where trial ends in 3 days or today
      const expiringTrials = await prisma.memberSubscription.findMany({
        where: {
          status: 'active',
          trialEndsAt: {
            not: null,
            gte: today,
            lte: threeDaysFromNow,
          },
        },
        include: {
          member: true,
          plan: true,
          organization: true,
        },
      });

      console.log(`Found ${expiringTrials.length} expiring trials.`);

      // TODO: Send email reminders to these members
      for (const subscription of expiringTrials) {
        if (subscription.member.email) {
          console.log(`Would send trial reminder to ${subscription.member.email}`);
          // You can use sendEmail function here once email service is configured
        }
      }

      console.log('Trial expiration reminder cron job completed.');
    } catch (error) {
      console.error('Error running trial expiration reminder cron job:', error);
    }
  });

  // Run every day at 7:30 AM for organization subscriptions
  cron.schedule('30 7 * * *', async () => {
    try {
      console.log('Running organization subscription cron job...');
      
      const today = new Date();
      const threeDaysFromNow = new Date(today);
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      // Find organizations with plan_expiry in 3 days or today
      const organizations = await prisma.organization.findMany({
        where: {
          plan_expiry: {
            not: null,
            gte: today,
            lte: threeDaysFromNow,
          },
          plan_id: {
            not: null,
          },
        },
        include: {
          plan: true,
        },
      });

      console.log(`Found ${organizations.length} organizations with expiring plans.`);

      for (const org of organizations) {
        if (org.plan && org.plan_expiry) {
          // Generate invoice for organization
          const billingPeriodStart = org.plan_expiry as Date;
          const billingPeriodEnd = new Date(billingPeriodStart);
          billingPeriodEnd.setDate(billingPeriodEnd.getDate() + org.plan.duration_days);

          const dueDate = new Date(billingPeriodStart);
          dueDate.setDate(dueDate.getDate() + 7);

          await createInvoice({
            organizationId: org.id,
            planId: org.plan_id!,
            planType: 'organization',
            subtotal: org.plan.price,
            tax: 0,
            discount: 0,
            total: org.plan.price,
            dueDate,
            billingPeriodStart,
            billingPeriodEnd,
            isRecurring: true,
            notes: `${org.plan.name} - Organization plan renewal`,
            items: [
              {
                description: `${org.plan.name} Organization Plan`,
                quantity: 1,
                unitPrice: org.plan.price,
                total: org.plan.price,
              },
            ],
          });

          // Update organization plan expiry
          await prisma.organization.update({
            where: { id: org.id },
            data: {
              plan_expiry: billingPeriodEnd,
            },
          });

          console.log(`Generated renewal invoice for organization ${org.id}`);
        }
      }

      console.log('Organization subscription cron job completed.');
    } catch (error) {
      console.error('Error running organization subscription cron job:', error);
    }
  });

  // Run every day at 7:00 AM for member capacity reminders
  cron.schedule('0 7 * * *', async () => {
    try {
      console.log('Running member capacity reminder cron job...');
      
      // Get all organizations with a plan
      const organizations = await prisma.organization.findMany({
        where: {
          plan_id: {
            not: null,
          },
        },
        include: {
          plan: true,
          users: {
            where: {
              role: 'member',
            },
          },
        },
      });

      for (const org of organizations) {
        if (org.plan?.max_members) {
          const memberCount = org.users.length;
          const capacityPercentage = (memberCount / org.plan.max_members) * 100;

          // Check if at 90% or 100% capacity
          if (capacityPercentage >= 90) {
            console.log(
              `Organization ${org.name} is at ${capacityPercentage.toFixed(0)}% capacity (${memberCount}/${org.plan.max_members} members)`
            );
            // TODO: Send capacity reminder email to org admin
          }
        }
      }

      console.log('Member capacity reminder cron job completed.');
    } catch (error) {
      console.error('Error running member capacity reminder cron job:', error);
    }
  });

  console.log('Cron jobs started successfully.');
};
