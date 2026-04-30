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
      where: { id: id, user_id: req.user.userId },
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
      const plan = await prisma.plan.findUnique({ where: { id: plan_id } });
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
              plan_id: plan_id,
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
      where: { id: id },
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
      where: { id: id }
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ message: `Payment is already ${payment.status}. Cannot reject.` });
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: id },
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
      where: { id: id }
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({ message: `Only completed payments can be revoked. This payment is ${payment.status}.` });
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: id },
      data: {
        status: 'revoked',
        rejection_reason: reason || 'Fraudulent or invalid transaction detected after approval.',
      }
    });

    // 1. Revoke Plan Access (Fallback to Basic Plan ID 1)
    await prisma.user.update({
        where: { id: payment.user_id },
        data: {
            plan_id: null,
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

export const createOrgPlanPayment = async (req: any, res: Response) => {
  try {
    const { plan_id, payment_method, manual_transaction_id } = req.body;

    if (req.user.role !== 'orgAdmin') {
      return res.status(403).json({ message: 'Only organization admins can create org plan payments.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { organization: true }
    });

    if (!user?.organization) {
      return res.status(400).json({ message: 'No organization found for this user.' });
    }

    const plan = await prisma.plan.findUnique({ where: { id: plan_id } });
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    if (!manual_transaction_id) {
      return res.status(400).json({ message: 'Transaction ID is required for Telebirr or CBE Birr payments.' });
    }

    const existingPayment = await prisma.payment.findFirst({
      where: { transaction_id: manual_transaction_id }
    });

    if (existingPayment) {
      return res.status(400).json({
        message: `Transaction ID ${manual_transaction_id} has already been used.`
      });
    }

    const payment = await prisma.payment.create({
      data: {
        plan_id: plan.id,
        user_id: req.user.userId,
        amount: plan.price,
        payment_method: payment_method || 'manual_payment',
        status: 'pending',
        transaction_id: manual_transaction_id,
        payer_type: 'organization',
        payer_id: user.organization.id,
        payee_type: 'superadmin',
        payee_id: 'platform',
        reference_type: 'plan_subscription',
        reference_id: plan.id,
        organization_id: user.organization.id,
      }
    });

    const superAdmins = await prisma.user.findMany({ where: { role: 'SuperAdmin' } });
    if (superAdmins.length > 0) {
      const notificationsData = superAdmins.map(admin => ({
        userId: admin.id,
        title: `New org subscription payment: ${user.organization?.name || 'Unknown'} paid ${plan.price} ETB via ${payment_method || 'Telebirr/CBE Birr'} (Txn: ${manual_transaction_id})`
      }));
      await prisma.notification.createMany({ data: notificationsData });
    }

    res.status(201).json({
      message: 'Organization plan payment submitted and is pending SuperAdmin confirmation.',
      payment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating organization plan payment', error });
  }
};

export const createEventPayment = async (req: any, res: Response) => {
  try {
    const { event_id, payment_method, manual_transaction_id } = req.body;

    if (!event_id) {
      return res.status(400).json({ message: 'Event ID is required.' });
    }

    const event = await prisma.event.findUnique({
      where: { id: event_id },
      include: { organizations: true }
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    if (!event.payment_required || event.price === null) {
      return res.status(400).json({ message: 'This event does not require payment.' });
    }

    if (!manual_transaction_id) {
      return res.status(400).json({ message: 'Transaction ID is required for event payment.' });
    }

    const existingPayment = await prisma.payment.findFirst({
      where: {
        transaction_id: manual_transaction_id,
        reference_type: 'event',
        reference_id: event_id
      }
    });

    if (existingPayment) {
      return res.status(400).json({
        message: `Transaction ID ${manual_transaction_id} has already been used for this event.`
      });
    }

    const payment = await prisma.payment.create({
      data: {
        plan_id: '',
        user_id: req.user.userId,
        amount: event.price,
        payment_method: payment_method || 'manual_payment',
        status: 'pending',
        transaction_id: manual_transaction_id,
        payer_type: 'member',
        payer_id: req.user.userId,
        payee_type: 'organization',
        payee_id: event.organizationId,
        reference_type: 'event',
        reference_id: event_id,
        organization_id: event.organizationId || undefined,
      }
    });

    const orgAdmins = await prisma.user.findMany({
      where: {
        organizationId: event.organizationId,
        role: 'orgAdmin'
      }
    });

    if (orgAdmins.length > 0) {
      const notificationsData = orgAdmins.map(admin => ({
        userId: admin.id,
        title: `New event payment: Member paid ${event.price} ETB for "${event.title}" via ${payment_method || 'Telebirr/CBE Birr'} (Txn: ${manual_transaction_id})`
      }));
      await prisma.notification.createMany({ data: notificationsData });
    }

    res.status(201).json({
      message: 'Event payment submitted and is pending organization admin confirmation.',
      payment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating event payment', error });
  }
};

export const getOrgPayments = async (req: any, res: Response) => {
  try {
    if (req.user.role === 'SuperAdmin') {
      const payments = await prisma.payment.findMany({
        where: { reference_type: 'plan_subscription' },
        include: { user: true, plan: true },
      });
      return res.status(200).json(payments);
    }

    if (req.user.role === 'orgAdmin') {
      const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
      const payments = await prisma.payment.findMany({
        where: {
          OR: [
            { organization_id: user?.organizationId },
            { payer_id: user?.organizationId, payer_type: 'organization' }
          ]
        },
        include: { user: true, plan: true },
      });
      return res.status(200).json(payments);
    }

    const payments = await prisma.payment.findMany({
      where: {
        OR: [
          { user_id: req.user.userId },
          { payer_id: req.user.userId, payer_type: 'member' }
        ]
      },
      include: { user: true },
    });
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payments', error });
  }
};

export const confirmOrgPayment = async (req: any, res: Response) => {
  try {
    if (req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ message: 'Only SuperAdmin can confirm org plan payments.' });
    }

    const { id } = req.params;
    const payment = await prisma.payment.findUnique({
      where: { id: id },
      include: { plan: true }
    });

    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.status !== 'pending') return res.status(400).json({ message: 'Payment is already processed.' });

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'completed' }
    });

    if (payment.payer_type === 'organization' && payment.payer_id) {
      await prisma.organization.update({
        where: { id: payment.payer_id },
        data: {
          plan_id: payment.plan?.id,
          plan_expiry: new Date(Date.now() + (payment.plan?.duration_days || 30) * 86400000),
        }
      }).catch(() => {});

      const orgAdmins = await prisma.user.findMany({
        where: { organizationId: payment.payer_id, role: 'orgAdmin' }
      });

      for (const admin of orgAdmins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: `Your organization payment of ${payment.amount} ETB has been approved! Subscription active until ${new Date(Date.now() + (payment.plan?.duration_days || 30) * 86400000).toLocaleDateString()}.`
          }
        });
      }
    }

    res.status(200).json({ message: 'Organization payment confirmed', payment: updatedPayment });
  } catch (error) {
    res.status(500).json({ message: 'Error confirming organization payment', error });
  }
};

export const rejectOrgPayment = async (req: any, res: Response) => {
  try {
    if (req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ message: 'Only SuperAdmin can reject org payments.' });
    }

    const { id } = req.params;
    const { reason } = req.body;

    const payment = await prisma.payment.findUnique({ where: { id: id } });
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });
    if (payment.status !== 'pending') return res.status(400).json({ message: 'Payment is already processed.' });

    const updatedPayment = await prisma.payment.update({
      where: { id: id },
      data: { status: 'rejected', rejection_reason: reason || 'Payment rejected by SuperAdmin.' }
    });

    if (payment.payer_type === 'organization' && payment.payer_id) {
      const orgAdmins = await prisma.user.findMany({
        where: { organizationId: payment.payer_id, role: 'orgAdmin' }
      });
      for (const admin of orgAdmins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: `Organization payment of ${payment.amount} ETB was rejected. Reason: ${reason || 'Invalid payment details.'}`
          }
        });
      }
    }

    res.status(200).json({ message: 'Organization payment rejected', payment: updatedPayment });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting organization payment', error });
  }
};

export const confirmEventPayment = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({ where: { id: id } });
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });
    if (payment.status !== 'pending') return res.status(400).json({ message: 'Payment is already processed.' });

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'completed' }
    });

    if (payment.reference_type === 'event' && payment.reference_id) {
      const event = await prisma.event.findUnique({ where: { id: payment.reference_id } });
      if (event) {
        await prisma.event.update({
          where: { id: event.id },
          data: {
            attendeesIds: {
              push: payment.user_id
            }
          }
        }).catch(() => {});

        const eventOrgAdmins = await prisma.user.findMany({
          where: { organizationId: event.organizationId, role: 'orgAdmin' }
        });
        for (const admin of eventOrgAdmins) {
          await prisma.notification.create({
            data: {
              userId: admin.id,
              title: `Event payment for "${event.title}" confirmed. Member has been registered.`
            }
          });
        }

        const member = await prisma.user.findUnique({ where: { id: payment.user_id } });
        if (member) {
          await prisma.notification.create({
            data: {
              userId: member.id,
              title: `Your payment of ${payment.amount} ETB for "${event.title}" has been confirmed. You are now registered!`
            }
          });
        }
      }
    }

    res.status(200).json({ message: 'Event payment confirmed', payment: updatedPayment });
  } catch (error) {
    res.status(500).json({ message: 'Error confirming event payment', error });
  }
};

export const rejectEventPayment = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const payment = await prisma.payment.findUnique({ where: { id: id } });
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });
    if (payment.status !== 'pending') return res.status(400).json({ message: 'Payment is already processed.' });

    const updatedPayment = await prisma.payment.update({
      where: { id: id },
      data: { status: 'rejected', rejection_reason: reason || 'Event payment rejected.' }
    });

    const member = await prisma.user.findUnique({ where: { id: payment.user_id } });
    if (member) {
      await prisma.notification.create({
        data: {
          userId: member.id,
          title: `Your event payment of ${payment.amount} ETB was rejected. Reason: ${reason || 'Invalid payment details.'}`
        }
      });
    }

    res.status(200).json({ message: 'Event payment rejected', payment: updatedPayment });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting event payment', error });
  }
};

export const uploadMemberPaymentReceipt = async (req: any, res: Response) => {
  try {
      if (!req.file) {
          return res.status(400).json({ message: 'No receipt image uploaded.' });
      }

      const { reason, amount: reqAmount, payment_method, manual_transaction_id } = req.body;
      const imagePath = req.file.path;

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });

      if (!user?.organizationId) {
        return res.status(400).json({ message: 'User does not belong to any organization.' });
      }

      // 1. Run OCR Processing
      const extracted = await extractReceiptData(imagePath);
      let { transactionId, amount, isTelebirr, isCbeBirr } = extracted;

      if (manual_transaction_id) {
          transactionId = manual_transaction_id;
      }

      if (!manual_transaction_id) {
          if (payment_method === 'telebirr' && !isTelebirr) {
              return res.status(400).json({
                  message: 'The uploaded receipt does not appear to be a valid Telebirr screenshot.',
                  rawText: extracted.rawText,
                  requiresManualEntry: true
              });
          }
          if (payment_method === 'cbe_birr' && !isCbeBirr) {
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

      const expectedAmount = parseFloat(reqAmount);
      if (amount !== null && !manual_transaction_id && expectedAmount) {
          if (amount !== expectedAmount) {
              return res.status(400).json({
                  message: `The receipt amount (${amount} ETB) does not match the entered amount (${expectedAmount} ETB).`,
                  requiresManualEntry: true
              });
          }
      }

      const finalAmount = amount || expectedAmount || 0;

      const existingPayment = await prisma.payment.findFirst({
          where: { transaction_id: transactionId }
      });

      if (existingPayment) {
          return res.status(400).json({
              message: `Transaction ID ${transactionId} has already been used.`
          });
      }

      const payment = await prisma.payment.create({
          data: {
              user_id: req.user.userId,
              amount: finalAmount,
              payment_method: payment_method || 'telebirr',
              status: 'pending',
              transaction_id: transactionId,
              receipt_url: imagePath,
              payer_type: 'member',
              payer_id: req.user.userId.toString(),
              payee_type: 'organization',
              payee_id: user.organizationId.toString(),
              reference_type: 'member_to_org',
              reference_id: reason || 'Other',
              organization_id: user.organizationId,
          }
      });

      const orgAdmins = await prisma.user.findMany({ 
        where: { role: 'orgAdmin', organizationId: user.organizationId } 
      });
      if (orgAdmins.length > 0) {
          const notificationsData = orgAdmins.map(admin => ({
              userId: admin.id,
              title: `New member payment: ${user.name} paid ${finalAmount} ETB for "${reason || 'Other'}" via ${payment_method === 'telebirr' ? 'Telebirr' : 'CBE Birr'} (Txn ID: ${transactionId})`
          }));
          await prisma.notification.createMany({ data: notificationsData });
      }

      res.status(201).json({
          message: 'Payment receipt uploaded and is pending organization confirmation.',
          extracted_data: extracted,
          payment
      });
  } catch (error) {
      console.error('Member OCR Payment Error:', error);
      res.status(500).json({ message: 'Internal server error processing receipt.', error });
  }
};

export const uploadEventPaymentReceipt = async (req: any, res: Response) => {
  try {
      if (!req.file) {
          return res.status(400).json({ message: 'No receipt image uploaded.' });
      }

      const { event_id, payment_method, manual_transaction_id } = req.body;
      const imagePath = req.file.path;

      if (!event_id) {
          return res.status(400).json({ message: 'Event ID is required.' });
      }

      const event = await prisma.event.findUnique({
          where: { id: event_id }
      });

      if (!event) {
          return res.status(404).json({ message: 'Event not found.' });
      }

      // 1. Run OCR Processing
      const extracted = await extractReceiptData(imagePath);
      let { transactionId, amount, isTelebirr, isCbeBirr } = extracted;

      if (manual_transaction_id) {
          transactionId = manual_transaction_id;
      }

      if (!manual_transaction_id) {
          if (payment_method === 'telebirr' && !isTelebirr) {
              return res.status(400).json({
                  message: 'The uploaded receipt does not appear to be a valid Telebirr screenshot.',
                  rawText: extracted.rawText,
                  requiresManualEntry: true
              });
          }
          if (payment_method === 'cbe_birr' && !isCbeBirr) {
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

      if (amount !== null && !manual_transaction_id && event.price) {
          if (amount !== event.price) {
              return res.status(400).json({
                  message: `The receipt amount (${amount} ETB) does not match the event price (${event.price} ETB).`,
                  requiresManualEntry: true
              });
          }
      }

      const existingPayment = await prisma.payment.findFirst({
          where: { 
              transaction_id: transactionId,
              reference_type: 'event',
              reference_id: event_id
          }
      });

      if (existingPayment) {
          return res.status(400).json({
              message: `Transaction ID ${transactionId} has already been used for this event.`
          });
      }

      const payment = await prisma.payment.create({
          data: {
              user_id: req.user.userId,
              amount: event.price || amount || 0,
              payment_method: payment_method || 'telebirr',
              status: 'pending',
              transaction_id: transactionId,
              receipt_url: imagePath,
              payer_type: 'member',
              payer_id: req.user.userId,
              payee_type: 'organization',
              payee_id: event.organizationId || '',
              reference_type: 'event',
              reference_id: event_id,
              organization_id: event.organizationId,
          }
      });

      const orgAdmins = await prisma.user.findMany({ 
        where: { role: 'orgAdmin', organizationId: event.organizationId } 
      });
      if (orgAdmins.length > 0) {
          const notificationsData = orgAdmins.map(admin => ({
              userId: admin.id,
              title: `New event payment: Member paid for "${event.title}" via ${payment_method === 'telebirr' ? 'Telebirr' : 'CBE Birr'} (Txn ID: ${transactionId})`
          }));
          await prisma.notification.createMany({ data: notificationsData });
      }

      res.status(201).json({
          message: 'Event payment receipt uploaded and is pending organization confirmation.',
          extracted_data: extracted,
          payment
      });
  } catch (error) {
      console.error('Event OCR Payment Error:', error);
      res.status(500).json({ message: 'Internal server error processing receipt.', error });
  }
};

export const confirmMemberPayment = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({ where: { id: id } });
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });
    if (payment.status !== 'pending') return res.status(400).json({ message: 'Payment is already processed.' });

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (user?.role !== 'orgAdmin' || user?.organizationId?.toString() !== payment.payee_id) {
      return res.status(403).json({ message: 'Only the organization admin can confirm this payment.' });
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'completed' }
    });

    const member = await prisma.user.findUnique({ where: { id: payment.user_id } });
    if (member) {
      await prisma.notification.create({
        data: {
          userId: member.id,
          title: `Your payment of ${payment.amount} ETB for "${payment.reference_id}" has been confirmed by the organization!`
        }
      });
    }

    res.status(200).json({ message: 'Member payment confirmed', payment: updatedPayment });
  } catch (error) {
    res.status(500).json({ message: 'Error confirming member payment', error });
  }
};

export const rejectMemberPayment = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const payment = await prisma.payment.findUnique({ where: { id: id } });
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });
    if (payment.status !== 'pending') return res.status(400).json({ message: 'Payment is already processed.' });

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (user?.role !== 'orgAdmin' || user?.organizationId?.toString() !== payment.payee_id) {
      return res.status(403).json({ message: 'Only the organization admin can reject this payment.' });
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: id },
      data: { status: 'rejected', rejection_reason: reason || 'Payment rejected by Organization.' }
    });

    const member = await prisma.user.findUnique({ where: { id: payment.user_id } });
    if (member) {
      await prisma.notification.create({
        data: {
          userId: member.id,
          title: `Your payment of ${payment.amount} ETB for "${payment.reference_id}" was rejected. Reason: ${reason || 'Invalid payment details.'}`
        }
      });
    }

    res.status(200).json({ message: 'Member payment rejected', payment: updatedPayment });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting member payment', error });
  }
};
