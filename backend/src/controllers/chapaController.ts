import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as chapaService from '../services/chapaService';
import crypto from 'crypto';
import {
  getPlatformEventById,
  getPlatformServiceById,
  registerUserForPlatformEvent,
  subscribeUserToPlatformService,
} from '../data/predefinedCatalogStore';

const prisma = new PrismaClient();

const isValidId = (id: string) => typeof id === 'string' && id.length > 0;

/**
 * Initialize a Chapa payment for a Plan (Organization Upgrade)
 */
export const initializePlanPayment = async (req: any, res: Response) => {
  try {
    const { planId, amount, reason, phoneNumber, mode } = req.body;
    const userId = req.user.userId;
    const isInline = mode === 'inline';

    if (!userId || !isValidId(userId)) {
      return res.status(400).json({ message: 'Invalid User ID format' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    let finalAmount = amount;
    let finalTitle = reason || 'Plan Upgrade';

    if (planId && planId !== 'general-payment') {
      if (!isValidId(planId)) {
        return res.status(400).json({ message: 'Invalid Plan ID format' });
      }
      const plan = await prisma.plan.findUnique({ where: { id: planId } });
      if (!plan) return res.status(404).json({ message: 'Plan not found' });
      finalAmount = plan.price.toString();
      finalTitle = `Upgrade to ${plan.name}`;
    }

    if (!finalAmount) {
      return res.status(400).json({ message: 'Payment amount could not be determined.' });
    }

    const tx_ref = `p-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

    const callback_url = `${process.env.BACKEND_URL}/api/chapa/webhook`;
    const return_url = `${process.env.FRONTEND_URL}/org-admin/payments?tx_ref=${tx_ref}`;

    const firstName = user.name.split(' ')[0] || 'User';
    const lastName = user.name.split(' ').slice(1).join(' ') || 'Name';

    const chapaData: any = {
      amount: finalAmount.toString(),
      currency: 'ETB',
      email: user.email,
      first_name: firstName,
      last_name: lastName,
      tx_ref,
      return_url,
      customization: {
        title: 'Plan Upgrade',
      },
    };

    // Only add callback_url if it's not localhost
    if (process.env.BACKEND_URL && !process.env.BACKEND_URL.includes('localhost')) {
        chapaData.callback_url = callback_url;
    }

    // Use provided phoneNumber or fall back to user's phone
    const phoneToUse = phoneNumber || user.phone;
    if (phoneToUse) {
        const cleanPhone = phoneToUse.replace(/[^\d+]/g, '');
        if (cleanPhone) chapaData.phone_number = cleanPhone;
    }

    console.log(`Initializing Chapa Payment (mode: ${mode || 'standard'}) with data:`, JSON.stringify(chapaData, null, 2));

    let response: any = { status: 'success' };
    if (!isInline) {
        try {
          response = await chapaService.initializePayment(chapaData);
          console.log('Chapa Service Response:', JSON.stringify(response, null, 2));
        } catch (chapaErr: any) {
          console.error('Error calling Chapa Service:', chapaErr.message);
          return res.status(400).json({ 
            message: 'Chapa initialization failed', 
            error: chapaErr.message,
            details: chapaErr.response?.data
          });
        }
    } else {
        console.log('Skipping Chapa API call for inline mode - frontend SDK will handle it');
    }

    // Create a pending payment record
    try {
      await prisma.payment.create({
        data: {
          user_id: userId,
          plan_id: (planId && planId !== 'general-payment' && planId.length === 24) ? planId : null,
          amount: parseFloat(finalAmount.toString()),
          payment_method: 'chapa',
          status: 'pending',
          transaction_id: tx_ref,
          reference_id: finalTitle,
        },
      });
      console.log('Pending payment record created in DB');
    } catch (prismaErr: any) {
      console.error('Error creating payment record in Prisma:', prismaErr);
      // We still return the response from Chapa so the user can pay, but log the error
    }

    res.status(200).json({
      ...response,
      tx_ref
    });
  } catch (error: any) {
    console.error('Unexpected Chapa Initialization Error (Plan):', error);
    res.status(500).json({ message: error.message || 'Internal server error during Chapa initialization' });
  }
};

/**
 * Initialize a Chapa payment for an Event Ticket
 */
export const initializeEventPayment = async (req: any, res: Response) => {
  try {
    const { eventId, phoneNumber, mode } = req.body;
    const userId = req.user.userId;
    const isInline = mode === 'inline';

    if (!userId || !isValidId(userId)) {
      return res.status(400).json({ message: 'Invalid User ID format' });
    }

    if (!eventId || !isValidId(eventId)) {
      return res.status(400).json({ message: 'Invalid Event ID format' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const platformEvent = getPlatformEventById(eventId);
    const event =
      platformEvent ?? (await prisma.event.findUnique({ where: { id: eventId } }));
    if (!event || event.price == null) return res.status(404).json({ message: 'Event or price not found' });

    const tx_ref = `e-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    const callback_url = `${process.env.BACKEND_URL}/api/chapa/webhook`;
    const return_url = `${process.env.FRONTEND_URL}/member/payments?tx_ref=${tx_ref}`;

    const firstName = user.name.split(' ')[0] || 'User';
    const lastName = user.name.split(' ').slice(1).join(' ') || 'Name';

    const chapaData: any = {
      amount: event.price.toString(),
      currency: 'ETB',
      email: user.email,
      first_name: firstName,
      last_name: lastName,
      tx_ref,
      return_url,
      customization: {
        title: 'Event Ticket',
      },
    };

    // Only add callback_url if it's not localhost
    if (process.env.BACKEND_URL && !process.env.BACKEND_URL.includes('localhost')) {
        chapaData.callback_url = callback_url;
    }

    const phoneToUse = phoneNumber || user.phone;
    if (phoneToUse) {
        const cleanPhone = phoneToUse.replace(/[^\d+]/g, '');
        if (cleanPhone) chapaData.phone_number = cleanPhone;
    }

    console.log(`Initializing Chapa Event Payment (mode: ${mode || 'standard'}) with data:`, JSON.stringify(chapaData, null, 2));

    let response: any = { status: 'success' };
    if (!isInline) {
        try {
          response = await chapaService.initializePayment(chapaData);
          console.log('Chapa Event Response:', JSON.stringify(response, null, 2));
        } catch (chapaErr: any) {
          console.error('Error calling Chapa Service for Event:', chapaErr.message);
          return res.status(400).json({ 
            message: 'Chapa initialization failed', 
            error: chapaErr.message,
            details: chapaErr.response?.data
          });
        }
    } else {
        console.log('Skipping Chapa API call for inline event payment - frontend SDK will handle it');
    }

    // Create a pending event payment record
    try {
      await prisma.payment.create({
        data: {
          user_id: userId,
          amount: event.price,
          payment_method: 'chapa',
          status: 'pending',
          transaction_id: tx_ref,
          reference_id: eventId,
          reference_type: 'event',
        },
      });
      console.log('Pending event payment record created in DB');
    } catch (prismaErr: any) {
      console.error('Error creating event payment record in Prisma:', prismaErr);
    }

    res.status(200).json({
      ...response,
      tx_ref
    });
  } catch (error: any) {
    console.error('Unexpected Chapa Initialization Error (Event):', error);
    res.status(500).json({ message: error.message || 'Internal server error during Chapa initialization' });
  }
};

/**
 * Handle Chapa Webhook
 */
export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const hash = crypto
      .createHmac('sha256', process.env.CHAPA_WEBHOOK_SECRET!)
      .update(JSON.stringify(req.body))
      .digest('hex');

    // In production, you should verify the signature
    // if (hash !== req.headers['x-chapa-signature']) {
    //   return res.status(401).send('Invalid signature');
    // }

    const { tx_ref, status } = req.body;

    if (status === 'success') {
      await processSuccessfulTransaction(tx_ref);
    }

    res.status(200).send('Webhook received');
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).send('Webhook error');
  }
};

/**
 * Verify Transaction after redirect
 */
export const verifyTransaction = async (req: Request, res: Response) => {
  try {
    const { tx_ref } = req.params;
    const response = await chapaService.verifyTransaction(tx_ref);

    if (response.status === 'success') {
      await processSuccessfulTransaction(tx_ref);
    }

    res.status(200).json(response);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Initialize a Chapa payment for a Member Subscription Plan
 */
export const initializeMemberSubscriptionPayment = async (req: any, res: Response) => {
  try {
    const { planId, phoneNumber, mode } = req.body;
    const userId = req.user.userId;
    const isInline = mode === 'inline';

    if (!userId || !isValidId(userId) && !planId.startsWith('default-')) {
      return res.status(400).json({ message: 'Invalid User ID format' });
    }

    if (!planId) {
      return res.status(400).json({ message: 'Plan ID is required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Default plans
    const defaultPlans: Record<string, any> = {
      'default-free': {
        id: 'default-free',
        name: 'Free',
        price: 0,
        currency: 'ETB',
        billingCycle: 'monthly',
        durationDays: 30,
        features: ['overview', 'profile'],
        trialDays: null,
      },
      'default-basic': {
        id: 'default-basic',
        name: 'Basic',
        price: 100,
        currency: 'ETB',
        billingCycle: 'monthly',
        durationDays: 30,
        features: ['overview', 'profile', 'events', 'services', 'news', 'contact'],
        trialDays: 7,
      },
      'default-premium': {
        id: 'default-premium',
        name: 'Premium',
        price: 300,
        currency: 'ETB',
        billingCycle: 'monthly',
        durationDays: 30,
        features: [
          'overview', 'profile', 'events', 'services', 'news', 'contact',
          'subscriptions', 'payments', 'tickets', 'chat', 'id-cards', 'licenses'
        ],
        trialDays: 14,
      }
    };

    let plan;
    if (defaultPlans[planId]) {
      plan = defaultPlans[planId];
    } else {
      if (!isValidId(planId)) {
        return res.status(400).json({ message: 'Invalid Plan ID format' });
      }
      plan = await prisma.memberSubscriptionPlan.findUnique({ where: { id: planId } });
    }

    if (!plan) return res.status(404).json({ message: 'Member Subscription Plan not found' });

    const tx_ref = `ms-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    const callback_url = `${process.env.BACKEND_URL}/api/chapa/webhook`;
    const return_url = `${process.env.FRONTEND_URL}/member/payments?tx_ref=${tx_ref}`;

    const firstName = user.name.split(' ')[0] || 'User';
    const lastName = user.name.split(' ').slice(1).join(' ') || 'Name';

    const chapaData: any = {
      amount: plan.price.toString(),
      currency: plan.currency || 'ETB',
      email: user.email,
      first_name: firstName,
      last_name: lastName,
      tx_ref,
      return_url,
      customization: {
        title: 'Member Subscription',
      },
    };

    if (process.env.BACKEND_URL && !process.env.BACKEND_URL.includes('localhost')) {
        chapaData.callback_url = callback_url;
    }

    const phoneToUse = phoneNumber || user.phone;
    if (phoneToUse) {
        const cleanPhone = phoneToUse.replace(/[^\d+]/g, '');
        if (cleanPhone) chapaData.phone_number = cleanPhone;
    }

    console.log(`Initializing Chapa Member Subscription Payment (mode: ${mode || 'standard'}) with data:`, JSON.stringify(chapaData, null, 2));

    let response: any = { status: 'success' };
    if (!isInline) {
        try {
          response = await chapaService.initializePayment(chapaData);
          console.log('Chapa Member Subscription Response:', JSON.stringify(response, null, 2));
        } catch (chapaErr: any) {
          console.error('Error calling Chapa Service for Member Subscription:', chapaErr.message);
          return res.status(400).json({ 
            message: 'Chapa initialization failed', 
            error: chapaErr.message,
            details: chapaErr.response?.data
          });
        }
    } else {
        console.log('Skipping Chapa API call for inline member subscription payment - frontend SDK will handle it');
    }

    try {
      await prisma.payment.create({
        data: {
          user_id: userId,
          amount: plan.price,
          payment_method: 'chapa',
          status: 'pending',
          transaction_id: tx_ref,
          reference_id: planId,
          reference_type: 'member-subscription',
        },
      });
      console.log('Pending member subscription payment record created in DB');
    } catch (prismaErr: any) {
      console.error('Error creating member subscription payment record in Prisma:', prismaErr);
    }

    res.status(200).json({
      ...response,
      tx_ref
    });
  } catch (error: any) {
    console.error('Unexpected Chapa Initialization Error (Member Subscription):', error);
    res.status(500).json({ message: error.message || 'Internal server error during Chapa initialization' });
  }
};

/**
 * Initialize a Chapa payment for a Service Subscription
 */
export const initializeServicePayment = async (req: any, res: Response) => {
  try {
    const { serviceId, phoneNumber, mode } = req.body;
    const userId = req.user.userId;
    const isInline = mode === 'inline';

    if (!userId || !isValidId(userId)) {
      return res.status(400).json({ message: 'Invalid User ID format' });
    }

    if (!serviceId || !isValidId(serviceId)) {
      return res.status(400).json({ message: 'Invalid Service ID format' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const platformService = getPlatformServiceById(serviceId);
    const service =
      platformService ?? (await prisma.service.findUnique({ where: { id: serviceId } }));
    if (!service || service.price == null) return res.status(404).json({ message: 'Service or price not found' });

    const tx_ref = `s-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    const callback_url = `${process.env.BACKEND_URL}/api/chapa/webhook`;
    const return_url = `${process.env.FRONTEND_URL}/member/payments?tx_ref=${tx_ref}`;

    const firstName = user.name.split(' ')[0] || 'User';
    const lastName = user.name.split(' ').slice(1).join(' ') || 'Name';

    const chapaData: any = {
      amount: service.price.toString(),
      currency: 'ETB',
      email: user.email,
      first_name: firstName,
      last_name: lastName,
      tx_ref,
      return_url,
      customization: {
        title: 'Service Subscription',
      },
    };

    if (process.env.BACKEND_URL && !process.env.BACKEND_URL.includes('localhost')) {
        chapaData.callback_url = callback_url;
    }

    const phoneToUse = phoneNumber || user.phone;
    if (phoneToUse) {
        const cleanPhone = phoneToUse.replace(/[^\d+]/g, '');
        if (cleanPhone) chapaData.phone_number = cleanPhone;
    }

    console.log(`Initializing Chapa Service Payment (mode: ${mode || 'standard'}) with data:`, JSON.stringify(chapaData, null, 2));

    let response: any = { status: 'success' };
    if (!isInline) {
        try {
          response = await chapaService.initializePayment(chapaData);
          console.log('Chapa Service Response:', JSON.stringify(response, null, 2));
        } catch (chapaErr: any) {
          console.error('Error calling Chapa Service for Service:', chapaErr.message);
          return res.status(400).json({ 
            message: 'Chapa initialization failed', 
            error: chapaErr.message,
            details: chapaErr.response?.data
          });
        }
    } else {
        console.log('Skipping Chapa API call for inline service payment - frontend SDK will handle it');
    }

    try {
      await prisma.payment.create({
        data: {
          user_id: userId,
          amount: service.price,
          payment_method: 'chapa',
          status: 'pending',
          transaction_id: tx_ref,
          reference_id: serviceId,
          reference_type: 'service',
        },
      });
      console.log('Pending service payment record created in DB');
    } catch (prismaErr: any) {
      console.error('Error creating service payment record in Prisma:', prismaErr);
    }

    res.status(200).json({
      ...response,
      tx_ref
    });
  } catch (error: any) {
    console.error('Unexpected Chapa Initialization Error (Service):', error);
    res.status(500).json({ message: error.message || 'Internal server error during Chapa initialization' });
  }
};

/**
 * Helper to process successful transaction
 */
async function processSuccessfulTransaction(tx_ref: string) {
  // 1. Check if it's a Plan Payment
  if (tx_ref.startsWith('p-')) {
    const payment = await prisma.payment.findFirst({
      where: { transaction_id: tx_ref, status: 'pending' },
      include: { plan: true },
    });

    if (payment && payment.plan) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + payment.plan.duration_days);

      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'completed' },
        }),
        prisma.user.update({
          where: { id: payment.user_id },
          data: {
            plan_id: payment.plan_id,
            plan_expiry: expiryDate,
          },
        }),
        prisma.notification.create({
          data: {
            userId: payment.user_id,
            title: `Your plan upgrade to ${payment.plan.name} was successful!`,
          },
        }),
      ]);
    }
  } 
  // 2. Check if it's an Event Payment
  else if (tx_ref.startsWith('e-')) {
    const eventPayment = await prisma.payment.findFirst({
      where: { transaction_id: tx_ref, status: 'pending' },
    });

    if (eventPayment && eventPayment.reference_id) {
      const eventId = eventPayment.reference_id;
      const platformEvent = getPlatformEventById(eventId);

      await prisma.payment.update({
        where: { id: eventPayment.id },
        data: { status: 'completed' },
      });

      if (platformEvent) {
        await registerUserForPlatformEvent(eventPayment.user_id, eventId).catch(() => {});
      } else {
        await prisma.event
          .update({
            where: { id: eventId },
            data: {
              attendees: { connect: { id: eventPayment.user_id } },
            },
          })
          .catch(() => {});
      }

      await prisma.notification.create({
        data: {
          userId: eventPayment.user_id,
          title: `Ticket purchase successful! You are now registered for the event.`,
        },
      });
    }
  }
  // 3. Check if it's a Member Subscription Payment
  else if (tx_ref.startsWith('ms-')) {
    const memberSubscriptionPayment = await prisma.payment.findFirst({
      where: { transaction_id: tx_ref, status: 'pending' },
    });

    if (memberSubscriptionPayment && memberSubscriptionPayment.reference_id) {
      const planId = memberSubscriptionPayment.reference_id;
      const user = await prisma.user.findUnique({ 
        where: { id: memberSubscriptionPayment.user_id },
        include: { organization: true },
      });

      // Default plans
      const defaultPlans: Record<string, any> = {
        'default-free': {
          id: 'default-free',
          name: 'Free',
          price: 0,
          currency: 'ETB',
          billingCycle: 'monthly',
          durationDays: 30,
          features: ['overview', 'profile'],
          trialDays: null,
        },
        'default-basic': {
          id: 'default-basic',
          name: 'Basic',
          price: 100,
          currency: 'ETB',
          billingCycle: 'monthly',
          durationDays: 30,
          features: ['overview', 'profile', 'events', 'services', 'news', 'contact'],
          trialDays: 7,
        },
        'default-premium': {
          id: 'default-premium',
          name: 'Premium',
          price: 300,
          currency: 'ETB',
          billingCycle: 'monthly',
          durationDays: 30,
          features: [
            'overview', 'profile', 'events', 'services', 'news', 'contact',
            'subscriptions', 'payments', 'tickets', 'chat', 'id-cards', 'licenses'
          ],
          trialDays: 14,
        }
      };

      let plan;
      if (defaultPlans[planId]) {
        plan = defaultPlans[planId];
      } else {
        plan = await prisma.memberSubscriptionPlan.findUnique({ where: { id: planId } });
      }

      if (!user || !plan || !user.organizationId) {
        console.error('Missing user, plan, or organization for member subscription payment');
        return;
      }

      const actualStartDate = new Date();
      const nextBillingDate = new Date(actualStartDate);
      nextBillingDate.setDate(nextBillingDate.getDate() + plan.durationDays);

      const trialEndsAt = plan.trialDays
        ? new Date(actualStartDate.getTime() + plan.trialDays * 24 * 60 * 60 * 1000)
        : null;

      // Check for existing active subscription
      const existingActiveSubscription = await prisma.memberSubscription.findFirst({
        where: {
          memberId: user.id,
          organizationId: user.organizationId,
          status: 'active',
        },
      });

      let subscription;

      if (existingActiveSubscription) {
        // Upgrade
        await prisma.memberSubscription.update({
          where: { id: existingActiveSubscription.id },
          data: {
            status: 'cancelled',
            cancellationDate: new Date(),
            cancellationReason: 'Upgraded to new plan',
            autoRenew: false,
          },
        });

        subscription = await prisma.memberSubscription.create({
          data: {
            memberId: user.id,
            organizationId: user.organizationId,
            planId,
            status: 'active',
            startDate: actualStartDate,
            nextBillingDate,
            trialEndsAt,
          },
        });
      } else {
        // First subscription
        subscription = await prisma.memberSubscription.create({
          data: {
            memberId: user.id,
            organizationId: user.organizationId,
            planId,
            status: 'active',
            startDate: actualStartDate,
            nextBillingDate,
            trialEndsAt,
          },
        });
      }

      // Create invoice
      const dueDate = new Date(actualStartDate);
      dueDate.setDate(dueDate.getDate() + 7);

      // Dynamically import createInvoice from invoiceService
      const { createInvoice } = await import('../services/invoiceService.js');

      await createInvoice({
        organizationId: user.organizationId,
        memberId: user.id,
        subscriptionId: subscription.id,
        planId,
        planType: 'member',
        subtotal: plan.price,
        tax: 0,
        discount: 0,
        total: plan.price,
        dueDate,
        billingPeriodStart: actualStartDate,
        billingPeriodEnd: nextBillingDate,
        isRecurring: true,
        notes: existingActiveSubscription 
          ? `${plan.name} - ${plan.billingCycle} subscription (upgraded)` 
          : `${plan.name} - ${plan.billingCycle} subscription (self-subscribed)`,
        items: [
          {
            description: `${plan.name} Subscription`,
            quantity: 1,
            unitPrice: plan.price,
            total: plan.price,
          },
        ],
      });

      // Create member subscription payment record
      await prisma.memberSubscriptionPayment.create({
        data: {
          subscriptionId: subscription.id,
          paymentId: memberSubscriptionPayment.id,
          amount: plan.price,
          periodStart: actualStartDate,
          periodEnd: nextBillingDate,
          status: 'completed',
        },
      });

      await prisma.$transaction([
        prisma.payment.update({
          where: { id: memberSubscriptionPayment.id },
          data: { status: 'completed' },
        }),
        prisma.notification.create({
          data: {
            userId: memberSubscriptionPayment.user_id,
            title: `Your subscription to ${plan.name} was successful!`,
          },
        }),
      ]);
    }
  }
  // 4. Check if it's a Service Payment
  else if (tx_ref.startsWith('s-')) {
    const servicePayment = await prisma.payment.findFirst({
      where: { transaction_id: tx_ref, status: 'pending' },
    });

    if (servicePayment && servicePayment.reference_id) {
      const serviceId = servicePayment.reference_id;
      const platformService = getPlatformServiceById(serviceId);
      const dbService = platformService
        ? null
        : await prisma.service.findUnique({ where: { id: serviceId } });
      const serviceTitle =
        platformService?.title ?? dbService?.title ?? 'service';

      await prisma.payment.update({
        where: { id: servicePayment.id },
        data: { status: 'completed' },
      });

      if (platformService) {
        await subscribeUserToPlatformService(servicePayment.user_id, serviceId).catch(() => {});
      } else if (dbService) {
        await prisma.service
          .update({
            where: { id: serviceId },
            data: {
              subscribers: { connect: { id: servicePayment.user_id } },
            },
          })
          .catch(() => {});
      }

      await prisma.notification.create({
        data: {
          userId: servicePayment.user_id,
          title: `Service subscription successful! You are now subscribed to "${serviceTitle}".`,
        },
      });
    }
  }
}

/**
 * Upload manual payment receipt for Member Subscription (with OCR)
 */
export const uploadMemberSubscriptionReceipt = async (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No receipt image uploaded.' });
    }

    const { planId, paymentMethod, manualTransactionId } = req.body;
    const imagePath = req.file.path;

    if (!planId || !isValidId(planId)) {
      return res.status(400).json({ message: 'Invalid Member Subscription Plan ID format' });
    }

    const user = await prisma.user.findUnique({ 
      where: { id: req.user.userId },
      include: { organization: true },
    });

    if (!user?.organizationId) {
      return res.status(400).json({ message: 'User does not belong to any organization.' });
    }

    const plan = await prisma.memberSubscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) return res.status(404).json({ message: 'Member Subscription Plan not found' });

    // 1. Run OCR Processing
    const { extractReceiptData } = await import('../services/ocrService.js');
    const extracted = await extractReceiptData(imagePath);
    let { transactionId, amount, isTelebirr, isCbeBirr } = extracted;

    // Allow manual override
    if (manualTransactionId) {
      transactionId = manualTransactionId;
    }

    // Validate payment method matches receipt (if not manually overridden)
    if (!manualTransactionId) {
      if (paymentMethod === 'telebirr' && !isTelebirr) {
        return res.status(400).json({
          message: 'The uploaded receipt does not appear to be a valid Telebirr screenshot.',
          rawText: extracted.rawText,
          requiresManualEntry: true
        });
      }
      if (paymentMethod === 'cbe-birr' && !isCbeBirr) {
        return res.status(400).json({
          message: 'The uploaded receipt does not appear to be a valid CBE Birr screenshot.',
          rawText: extracted.rawText,
          requiresManualEntry: true
        });
      }
    }

    if (!transactionId) {
      return res.status(400).json({
        message: 'Could not extract a Transaction ID from the image. Please enter it manually.',
        rawText: extracted.rawText,
        requiresManualEntry: true
      });
    }

    // Validate amount matches plan price
    if (amount !== null && !manualTransactionId) {
      if (amount !== plan.price) {
        return res.status(400).json({
          message: `The receipt amount (${amount} ETB) does not match the plan price (${plan.price} ETB).`,
          requiresManualEntry: true
        });
      }
    }

    const finalAmount = amount || plan.price;

    // Check for existing transaction ID
    const existingPayment = await prisma.payment.findFirst({
      where: { transaction_id: transactionId }
    });

    if (existingPayment) {
      return res.status(400).json({
        message: `Transaction ID ${transactionId} has already been used.`
      });
    }

    // Create pending payment
    const payment = await prisma.payment.create({
      data: {
        user_id: req.user.userId,
        amount: finalAmount,
        payment_method: paymentMethod || 'telebirr',
        status: 'pending',
        transaction_id: transactionId,
        receipt_url: imagePath,
        payer_type: 'member',
        payer_id: req.user.userId,
        payee_type: 'organization',
        payee_id: user.organizationId,
        reference_type: 'member-subscription',
        reference_id: planId,
        organization_id: user.organizationId,
      }
    });

    // Notify org admins
    const orgAdmins = await prisma.user.findMany({
      where: { role: 'orgAdmin', organizationId: user.organizationId }
    });
    if (orgAdmins.length > 0) {
      const notificationsData = orgAdmins.map(admin => ({
        userId: admin.id,
        title: `New member subscription payment: ${user.name} paid ${finalAmount} ETB for ${plan.name} (Txn ID: ${transactionId})`
      }));
      await prisma.notification.createMany({ data: notificationsData });
    }

    res.status(201).json({
      message: 'Payment receipt uploaded and is pending organization confirmation.',
      extractedData: extracted,
      payment
    });
  } catch (error) {
    console.error('Member Subscription Receipt Error:', error);
    res.status(500).json({ message: 'Internal server error processing receipt.', error });
  }
};

/**
 * Confirm member subscription payment (org admin)
 */
export const confirmMemberSubscriptionPayment = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });
    if (payment.status !== 'pending') return res.status(400).json({ message: 'Payment is already processed.' });

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (user?.role !== 'orgAdmin' || user?.organizationId?.toString() !== payment.payee_id) {
      return res.status(403).json({ message: 'Only the organization admin can confirm this payment.' });
    }

    const planId = payment.reference_id;
    if (!planId) {
      return res.status(400).json({ message: 'Missing plan reference in payment.' });
    }
    const member = await prisma.user.findUnique({ where: { id: payment.user_id } });
    const plan = await prisma.memberSubscriptionPlan.findUnique({ where: { id: planId } });

    if (!member || !plan) {
      return res.status(404).json({ message: 'Member or Plan not found.' });
    }

    const actualStartDate = new Date();
    const nextBillingDate = new Date(actualStartDate);
    nextBillingDate.setDate(nextBillingDate.getDate() + plan.durationDays);

    const trialEndsAt = plan.trialDays
      ? new Date(actualStartDate.getTime() + plan.trialDays * 24 * 60 * 60 * 1000)
      : null;

    // Check for existing active subscription
    const existingActiveSubscription = await prisma.memberSubscription.findFirst({
      where: {
        memberId: member.id,
        organizationId: user.organizationId,
        status: 'active',
      },
    });

    let subscription;

    if (existingActiveSubscription) {
      // Upgrade - cancel old subscription and create new one
      await prisma.memberSubscription.update({
        where: { id: existingActiveSubscription.id },
        data: {
          status: 'cancelled',
          cancellationDate: new Date(),
          cancellationReason: 'Upgraded to new plan',
          autoRenew: false,
        },
      });

      subscription = await prisma.memberSubscription.create({
        data: {
          memberId: member.id,
          organizationId: user.organizationId,
          planId: planId,
          status: 'active',
          startDate: actualStartDate,
          nextBillingDate: nextBillingDate,
          trialEndsAt: trialEndsAt,
        },
      });
    } else {
      // First subscription
      subscription = await prisma.memberSubscription.create({
        data: {
          memberId: member.id,
          organizationId: user.organizationId,
          planId: planId,
          status: 'active',
          startDate: actualStartDate,
          nextBillingDate: nextBillingDate,
          trialEndsAt: trialEndsAt,
        },
      });
    }

    // Create invoice
    const dueDate = new Date(actualStartDate);
    dueDate.setDate(dueDate.getDate() + 7);

    const { createInvoice } = await import('../services/invoiceService.js');

    await createInvoice({
      organizationId: user.organizationId,
      memberId: member.id,
      subscriptionId: subscription.id,
      planId: planId,
      planType: 'member',
      subtotal: plan.price,
      tax: 0,
      discount: 0,
      total: plan.price,
      dueDate: dueDate,
      billingPeriodStart: actualStartDate,
      billingPeriodEnd: nextBillingDate,
      isRecurring: true,
      notes: existingActiveSubscription 
        ? `${plan.name} - ${plan.billingCycle} subscription (upgraded)` 
        : `${plan.name} - ${plan.billingCycle} subscription (self-subscribed)`,
      items: [
        {
          description: `${plan.name} Subscription`,
          quantity: 1,
          unitPrice: plan.price,
          total: plan.price,
        },
      ],
    });

    // Create member subscription payment record
    await prisma.memberSubscriptionPayment.create({
      data: {
        subscriptionId: subscription.id,
        paymentId: payment.id,
        amount: plan.price,
        periodStart: actualStartDate,
        periodEnd: nextBillingDate,
        status: 'completed',
      },
    });

    // Update payment status and notify member
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'completed' },
      }),
      prisma.notification.create({
        data: {
          userId: member.id,
          title: `Your subscription to ${plan.name} was successful!`,
        },
      }),
    ]);

    res.status(200).json({ message: 'Payment confirmed successfully' });
  } catch (error) {
    console.error('Confirm Member Subscription Payment Error:', error);
    res.status(500).json({ message: 'Error confirming payment.', error });
  }
};

/**
 * Reject member subscription payment (org admin)
 */
export const rejectMemberSubscriptionPayment = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });
    if (payment.status !== 'pending') return res.status(400).json({ message: 'Payment is already processed.' });

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (user?.role !== 'orgAdmin' || user?.organizationId?.toString() !== payment.payee_id) {
      return res.status(403).json({ message: 'Only the organization admin can reject this payment.' });
    }

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        status: 'rejected',
        rejection_reason: reason || 'No reason provided.',
      }
    });

    // Notify member
    await prisma.notification.create({
      data: {
        userId: payment.user_id,
        title: `Your subscription payment was rejected. Reason: ${reason || 'Invalid payment details.'}`
      }
    });

    res.status(200).json({ message: 'Payment rejected successfully', payment: updatedPayment });
  } catch (error) {
    console.error('Reject Member Subscription Payment Error:', error);
    res.status(500).json({ message: 'Error rejecting payment.', error });
  }
};

