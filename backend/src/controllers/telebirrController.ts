import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { TelebirrUtils } from '../utils/telebirrUtils';

const prisma = new PrismaClient();

const TELEBIRR_APP_ID = process.env.TELEBIRR_APP_ID || '';
const TELEBIRR_APP_SECRET = process.env.TELEBIRR_APP_SECRET || '';
const TELEBIRR_MERCHANT_CODE = process.env.TELEBIRR_MERCHANT_CODE || '';
const TELEBIRR_FABRIC_APP_ID = process.env.TELEBIRR_FABRIC_APP_ID || '';
const TELEBIRR_PRIVATE_KEY = (process.env.TELEBIRR_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const TELEBIRR_PUBLIC_KEY = (process.env.TELEBIRR_PUBLIC_KEY || '').replace(/\\n/g, '\n');
const TELEBIRR_CALLBACK_URL = process.env.TELEBIRR_CALLBACK_URL || '';
const TELEBIRR_RETURN_URL = process.env.TELEBIRR_RETURN_URL || '';

export const initializeTelebirrPayment = async (req: any, res: Response) => {
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

    const tx_ref = `tx-tele-${Date.now()}-${userId}`;

    // 1. Prepare Request Data
    const outTradeNo = tx_ref;
    const subject = `OMMS - ${plan.name} Plan`;
    const totalAmount = plan.price.toString();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = Math.random().toString(36).substring(2, 15);

    const ussdData = {
      appId: TELEBIRR_APP_ID,
      merchCode: TELEBIRR_MERCHANT_CODE,
      outTradeNo: outTradeNo,
      totalAmount: totalAmount,
      subject: subject,
      timeoutExpress: "30",
      callbackUrl: TELEBIRR_CALLBACK_URL,
      returnUrl: `${TELEBIRR_RETURN_URL}/${tx_ref}`,
      receiveName: "Organization Membership Management",
      shortCode: "654321", // Telebirr shortcode
    };

    // 2. Sign Data
    const sign = TelebirrUtils.signWithRSA(JSON.stringify(ussdData), TELEBIRR_PRIVATE_KEY);

    // 3. Prepare Payload
    const payload = {
      appid: TELEBIRR_APP_ID,
      sign: sign,
      ussd: TelebirrUtils.encryptWithRSA(JSON.stringify(ussdData), TELEBIRR_PUBLIC_KEY)
    };

    // Store pending payment
    await prisma.payment.create({
      data: {
        amount: plan.price,
        payment_method: 'Telebirr',
        status: 'pending',
        transaction_id: tx_ref,
        user_id: userId,
        plan_id: plan.id,
      },
    });

    // In a real scenario, you'd call Telebirr API here to get a prepay_id or redirect URL.
    // For this implementation, we return a success response with redirect info.
    // Telebirr Web Checkout usually involves redirecting to their platform.
    
    return res.status(200).json({
      status: 'success',
      checkout_url: `https://telebirr.com/payment?appId=${TELEBIRR_APP_ID}&payload=${encodeURIComponent(payload.ussd)}`, // Mock URL for demo
      tx_ref
    });

  } catch (error) {
    console.error('Telebirr Initialization Error:', error);
    res.status(500).json({ message: 'Error initializing Telebirr payment', error });
  }
};

export const handleTelebirrNotification = async (req: any, res: Response) => {
  try {
    // Telebirr sends an encrypted notification
    const { encryptedData } = req.body;

    if (!encryptedData) {
      return res.status(400).json({ message: 'Missing notification data' });
    }

    // 1. Decrypt Data
    const decryptedDataString = TelebirrUtils.decryptWithRSA(encryptedData, TELEBIRR_PRIVATE_KEY);
    const notification = JSON.parse(decryptedDataString);

    // 2. Verify and Process
    // notification usually contains: outTradeNo, tradeNo, totalAmount, tradeStatus
    const tx_ref = notification.outTradeNo;
    const status = notification.tradeStatus;

    if (status === 'Success') {
      const payment = await prisma.payment.findFirst({
        where: { transaction_id: tx_ref, status: 'pending' },
      });

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'completed' },
        });

        // Upgrade user plan
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
        }
      }
    }

    // Respond to Telebirr to acknowledge
    res.status(200).json({ code: 0, message: "Success" });
  } catch (error) {
    console.error('Telebirr Notification Error:', error);
    res.status(500).json({ message: 'Error handling notification' });
  }
};
