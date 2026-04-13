import { Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY || '';
const CHAPA_RETURN_URL = process.env.CHAPA_RETURN_URL || 'http://localhost:5173/payment/verify';

export const initializeChapaPayment = async (req: any, res: Response) => {
  try {
    const { planId } = req.body;
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    const plan = await prisma.plan.findUnique({
      where: { id: parseInt(planId) },
    });

    if (!user || !plan) {
      return res.status(404).json({ message: 'User or Plan not found' });
    }

    const tx_ref = `tx-omms-${Date.now()}-${userId}`;

    const chapaData = {
      amount: plan.price.toString(),
      currency: 'ETB',
      email: user.email,
      first_name: user.name.split(' ')[0] || 'Member',
      last_name: user.name.split(' ')[1] || 'User',
      tx_ref,
      callback_url: process.env.CHAPA_CALLBACK_URL,
      return_url: `${CHAPA_RETURN_URL}/${tx_ref}`,
      customization: {
        title: `OMMS ${plan.name} Plan`,
        description: `Subscription upgrade for ${user.organization?.name || 'Organization'}`
      }
    };

    const response = await fetch('https://api.chapa.co/v1/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chapaData),
    });

    const result: any = await response.json();

    if (result.status === 'success') {
      // Create a pending payment record
      await prisma.payment.create({
        data: {
          amount: plan.price,
          payment_method: 'Chapa',
          status: 'pending',
          transaction_id: tx_ref,
          user_id: userId,
          plan_id: plan.id,
        },
      });

      return res.status(200).json({ 
        status: 'success', 
        checkout_url: result.data.checkout_url 
      });
    } else {
      return res.status(400).json({ 
        status: 'error', 
        message: result.message || 'Chapa initialization failed' 
      });
    }
  } catch (error) {
    console.error('Chapa Initialization Error:', error);
    res.status(500).json({ message: 'Error initializing payment', error });
  }
};

export const verifyChapaPayment = async (req: any, res: Response) => {
  const { tx_ref } = req.params;
  try {
    console.log(`[Chapa] Verifying transaction: ${tx_ref}`);
    
    const response = await fetch(`https://api.chapa.co/v1/transaction/verify/${tx_ref}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CHAPA_SECRET_KEY}`,
      },
    });

    const result: any = await response.json();
    console.log(`[Chapa] Verification Response:`, JSON.stringify(result));

    // Flexible status check: Chapa usually returns { status: 'success', data: { status: 'success', ... } }
    const isSuccess = result.status === 'success' && 
                     (result.data?.status === 'success' || result.data?.status === 'completed');

    if (isSuccess) {
      // Find the pending payment
      const payment = await prisma.payment.findFirst({
        where: { transaction_id: tx_ref, status: 'pending' },
      });

      if (!payment) {
        console.warn(`[Chapa] Payment record not found or already processed for ref: ${tx_ref}`);
        // If it was already completed, we can still return success to the frontend
        const completedPayment = await prisma.payment.findFirst({
          where: { transaction_id: tx_ref, status: 'completed' },
        });
        
        if (completedPayment) {
          return res.status(200).json({ 
            status: 'success', 
            message: 'Payment already verified' 
          });
        }
        
        return res.status(404).json({ message: 'Payment record not found' });
      }

      // Update payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'completed' },
      });

      console.log(`[Chapa] Payment marked as completed for ref: ${tx_ref}`);

      // Upgrade user's plan
      const plan = await prisma.plan.findUnique({ where: { id: payment.plan_id } });
      if (plan) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + plan.duration_days);

        await prisma.user.update({
          where: { id: payment.user_id },
          data: {
            plan_id: plan.id,
            plan_expiry: expiryDate,
          },
        });
        console.log(`[Chapa] User ${payment.user_id} upgraded to plan ${plan.name}`);
      }

      return res.status(200).json({ 
        status: 'success', 
        message: 'Payment verified and plan upgraded' 
      });
    } else {
      console.error(`[Chapa] Verification failed for ${tx_ref}. Status: ${result.status}, data.status: ${result.data?.status}`);
      return res.status(400).json({ 
        status: 'error', 
        message: result.message || 'Payment verification failed' 
      });
    }
  } catch (error) {
    console.error(`[Chapa] Critical Verification Error for ${tx_ref}:`, error);
    res.status(500).json({ message: 'Error verifying payment', error: String(error) });
  }
};
