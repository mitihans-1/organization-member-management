import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as chapaService from '../services/chapaService';
import crypto from 'crypto';

const prisma = new PrismaClient();

const isValidObjectId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);

/**
 * Initialize a Chapa payment for a Plan (Organization Upgrade)
 */
export const initializePlanPayment = async (req: any, res: Response) => {
  try {
    const { planId, amount, reason } = req.body;
    const userId = req.user.userId;

    if (!userId || !isValidObjectId(userId)) {
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
      if (!isValidObjectId(planId)) {
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

    const tx_ref = `p-${Date.now()}`;

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

    // Clean phone number: remove everything except digits and +
    if (user.phone) {
        const cleanPhone = user.phone.replace(/[^\d+]/g, '');
        if (cleanPhone) chapaData.phone_number = cleanPhone;
    }

    console.log('Initializing Chapa Payment with data:', JSON.stringify(chapaData, null, 2));

    let response;
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
    const { eventId } = req.body;
    const userId = req.user.userId;

    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid User ID format' });
    }

    if (!eventId || !isValidObjectId(eventId)) {
      return res.status(400).json({ message: 'Invalid Event ID format' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event || !event.price) return res.status(404).json({ message: 'Event or price not found' });

    const tx_ref = `e-${Date.now()}`;
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

    if (user.phone) {
        const cleanPhone = user.phone.replace(/[^\d+]/g, '');
        if (cleanPhone) chapaData.phone_number = cleanPhone;
    }

    let response;
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

    // Create a pending event payment record
    try {
      await prisma.payment.create({
        data: {
          user_id: userId,
          amount: event.price,
          payment_method: 'chapa',
          status: 'pending',
          transaction_id: tx_ref,
          reference_id: `Ticket for ${event.title}`,
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
    const eventPayment = await (prisma as any).eventPayment.findFirst({
      where: { transactionId: tx_ref, status: 'pending' },
    });

    if (eventPayment) {
      await prisma.$transaction([
        (prisma as any).eventPayment.update({
          where: { id: eventPayment.id },
          data: { status: 'completed' },
        }),
        prisma.user.update({
          where: { id: eventPayment.userId },
          data: {
            attendedEventsIds: {
              push: eventPayment.eventId,
            },
          },
        }),
        prisma.event.update({
          where: { id: eventPayment.eventId },
          data: {
            attendeesIds: {
              push: eventPayment.userId,
            },
          },
        }),
        prisma.notification.create({
          data: {
            userId: eventPayment.userId,
            title: `Ticket purchase successful! You are now registered for the event.`,
          },
        }),
      ]);
    }
  }
}
