import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { extractReceiptData } from '../services/ocrService';

const prisma = new PrismaClient();

export const getPayments = async (req: any, res: Response) => {
  try {
    const whereClause = req.user.role === 'SuperAdmin' ? {} : { user_id: req.user.userId };
    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: { plan: true, user: true },
    });
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payments', error });
  }
};

export const createPayment = async (req: any, res: Response) => {
  try {
    const { plan_id, amount, payment_method, transaction_id } = req.body;
    const payment = await prisma.payment.create({
      data: {
        amount,
        payment_method,
        status: 'completed',
        transaction_id,
        user_id: req.user.userId,
        plan_id,
      },
    });

    // Update user's plan and expiry date
    const plan = await prisma.plan.findUnique({ where: { id: plan_id } });
    if (plan) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + plan.duration_days);

      await prisma.user.update({
        where: { id: req.user.userId },
        data: {
          plan_id: plan.id,
          plan_expiry: expiryDate,
        },
      });
    }

    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Error creating payment', error });
  }
};

export const getPaymentById = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(id), user_id: req.user.userId },
      include: { plan: true },
    });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payment', error });
  }
};

export const uploadPaymentReceipt = async (req: any, res: Response) => {
  try {
      if (!req.file) {
          return res.status(400).json({ message: 'No receipt image uploaded.' });
      }

      const { plan_id, payment_method, manual_transaction_id } = req.body;
      const imagePath = req.file.path; // Image saved by multer

      // 1. Run OCR Processing
      const extracted = await extractReceiptData(imagePath);
      let { transactionId, amount, isTelebirr, isCbeBirr } = extracted;

      // Allow manual override if OCR fails
      if (manual_transaction_id) {
          transactionId = manual_transaction_id;
      }

      // Validate payment method matches the receipt (only if not manually overridden)
      if (!manual_transaction_id) {
          if (payment_method === 'telebirr' && !isTelebirr) {
              return res.status(400).json({
                  message: 'The uploaded receipt does not appear to be a valid Telebirr screenshot. Please enter the Transaction ID manually if you are sure.',
                  rawText: extracted.rawText,
                  requiresManualEntry: true
              });
          }

          if (payment_method === 'cbe_birr' && !isCbeBirr) {
              return res.status(400).json({
                  message: 'The uploaded receipt does not appear to be a valid CBE Birr screenshot. Please enter the Transaction ID manually if you are sure.',
                  rawText: extracted.rawText,
                  requiresManualEntry: true
              });
          }
      }

      if (!transactionId) {
          return res.status(400).json({
              message: 'Could not extract a Transaction ID from the image. Please make sure the screenshot is clear or enter it manually.',
              rawText: extracted.rawText,
              requiresManualEntry: true
          });
      }

      // Validate amount fits the exact amount of the plan
      const plan = await prisma.plan.findUnique({ where: { id: parseInt(plan_id) } });
      if (!plan) {
          return res.status(404).json({ message: 'Plan not found' });
      }

      if (amount !== null && !manual_transaction_id) {
          // If the extracted amount doesn't match the plan price exactly
          if (amount !== plan.price) {
              return res.status(400).json({
                  message: `The receipt amount (${amount} ETB) does not match the plan price (${plan.price} ETB). Please enter the Transaction ID manually if you believe this is an error.`,
                  requiresManualEntry: true
              });
          }
      } else if (!manual_transaction_id) {
          return res.status(400).json({
              message: `Could not extract the payment amount from the receipt. Expected exactly ${plan.price} ETB. Please enter the Transaction ID manually.`,
              requiresManualEntry: true
          });
      }

      // If manual entry is used, we trust the amount matches the plan price for the sake of submission,
      // but the Admin MUST verify it manually by looking at the receipt image.
      const finalAmount = amount || plan.price;

      // 2. Check if Transaction ID was already used
      const existingPayment = await prisma.payment.findFirst({
          where: { transaction_id: transactionId }
      });

      if (existingPayment) {
          return res.status(400).json({
              message: `Transaction ID ${transactionId} has already been used.`
          });
      }

      // 3. Save as Pending Payment for Admin Confirmation
      const payment = await prisma.payment.create({
          data: {
              plan_id: parseInt(plan_id),
              user_id: req.user.userId, // From your auth middleware
              amount: finalAmount,           // Amount is strictly checked above or overridden manually
              payment_method: payment_method || 'telebirr',
              status: 'pending',        // CRITICAL: Must be confirmed by admin
              transaction_id: transactionId,
              // Note: You must add `receipt_url String?` to your Payment schema
              receipt_url: imagePath
          }
      });

      // 4. Notify SuperAdmins
      const superAdmins = await prisma.user.findMany({ where: { role: 'SuperAdmin' } });
      if (superAdmins.length > 0) {
          const notificationsData = superAdmins.map(admin => ({
              userId: admin.id,
              title: `New pending payment: ${finalAmount} ETB via ${payment_method === 'telebirr' ? 'Telebirr' : 'CBE Birr'} (Txn ID: ${transactionId})`
          }));
          await prisma.notification.createMany({ data: notificationsData });
      }

      res.status(201).json({
          message: 'Payment receipt uploaded and is pending admin confirmation.',
          extracted_data: extracted,
          payment
      });

  } catch (error) {
      console.error('OCR Payment Error:', error);
      res.status(500).json({ message: 'Internal server error processing receipt.', error });
  }
};

export const confirmPayment = async (req: any, res: Response) => {
  try {
    // Usually only SuperAdmin should confirm platform payments
    if (req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ message: 'Only SuperAdmin can confirm payments.' });
    }

    const { id } = req.params;
    
    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(id) },
      include: { plan: true }
    });

    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.status === 'completed') return res.status(400).json({ message: 'Payment is already confirmed.' });

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'completed' }
    });

    // Update user's plan and expiry date
    if (payment.plan) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + payment.plan.duration_days);

      await prisma.user.update({
        where: { id: payment.user_id },
        data: {
          plan_id: payment.plan.id,
          plan_expiry: expiryDate,
        },
      });

      // Notify the User that their payment was approved and plan upgraded
      await prisma.notification.create({
        data: {
            userId: payment.user_id,
            title: `Your payment of ${payment.amount} ETB has been approved! You are now on the ${payment.plan.name} plan until ${expiryDate.toLocaleDateString()}.`
        }
      });
    }

    res.status(200).json({ message: 'Payment confirmed successfully', payment: updatedPayment });
  } catch (error) {
    res.status(500).json({ message: 'Error confirming payment', error });
  }
};

export const rejectPayment = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const payment = await prisma.payment.findUnique({
      where: { id: Number(id) }
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ message: `Payment is already ${payment.status}. Cannot reject.` });
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: Number(id) },
      data: {
        status: 'rejected',
        rejection_reason: reason || 'No reason provided.',
      }
    });

    // Notify the User that their payment was rejected
    await prisma.notification.create({
        data: {
            userId: payment.user_id,
            title: `Your payment of ${payment.amount} ETB was rejected. Reason: ${reason || 'Invalid receipt or transaction details.'}`
        }
    });

    res.status(200).json({ message: 'Payment rejected successfully', payment: updatedPayment });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting payment', error });
  }
};

export const revokePayment = async (req: any, res: Response) => {
  try {
    // Only SuperAdmin should revoke payments
    if (req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ message: 'Only SuperAdmin can revoke payments.' });
    }

    const { id } = req.params;
    const { reason, suspendUser } = req.body;

    const payment = await prisma.payment.findUnique({
      where: { id: Number(id) }
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({ message: `Only completed payments can be revoked. This payment is ${payment.status}.` });
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: Number(id) },
      data: {
        status: 'revoked',
        rejection_reason: reason || 'Fraudulent or invalid transaction detected after approval.',
      }
    });

    // 1. Revoke Plan Access (Fallback to Basic Plan ID 1)
    await prisma.user.update({
        where: { id: payment.user_id },
        data: {
            plan_id: 1,
            plan_expiry: new Date(), // Expire immediately
        }
    });

    // 2. Notify the User of the Revocation
    await prisma.notification.create({
        data: {
            userId: payment.user_id,
            title: `CRITICAL ALERT: Your previously approved payment of ${payment.amount} ETB was revoked. Reason: ${reason || 'Invalid transaction detected.'} Your premium access has been immediately downgraded.`
        }
    });

    res.status(200).json({ message: 'Payment revoked and user downgraded successfully', payment: updatedPayment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error revoking payment', error });
  }
};
