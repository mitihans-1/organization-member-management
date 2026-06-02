import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getTransporter = async () => {
  console.log('=== getTransporter() ===');
  console.log('process.env.SMTP_USER:', process.env.SMTP_USER);
  console.log('process.env.SMTP_PASS:', process.env.SMTP_PASS ? '(set)' : '(not set)');
  console.log('process.env.SMTP_HOST:', process.env.SMTP_HOST);
  console.log('process.env.SMTP_PORT:', process.env.SMTP_PORT);

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    console.log('Using configured SMTP credentials');
    const isGmail = process.env.SMTP_HOST?.includes('gmail') || process.env.SMTP_USER?.includes('gmail.com');

    return nodemailer.createTransport(isGmail ? {
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // Must be a 16-character Google App Password
      },
    } : {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  } else {
    console.log('No SMTP credentials found. Creating a test Ethereal account...');
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
};

const logEmail = async (data: {
  to: string;
  subject: string;
  type: string;
  userId?: string;
  eventId?: string;
  paymentId?: string;
  scheduledAt?: Date;
}) => {
  return await prisma.emailNotificationLog.create({
    data: {
      to: data.to,
      subject: data.subject,
      type: data.type,
      userId: data.userId,
      eventId: data.eventId,
      paymentId: data.paymentId,
      scheduledAt: data.scheduledAt,
      status: 'pending',
    },
  });
};

const updateEmailLog = async (logId: string, status: 'sent' | 'failed', error?: string) => {
  return await prisma.emailNotificationLog.update({
    where: { id: logId },
    data: {
      status,
      error,
      sentAt: status === 'sent' ? new Date() : undefined,
    },
  });
};

// Helper function to build uniform email options across your application
const buildMailOptions = (to: string, subject: string, html: string) => {
  const smtpUser = process.env.SMTP_USER || 'noreply@orgmanagement.com';

  // CRITICAL FIX: The sender email address inside the brackets MUST match your authenticated process.env.SMTP_USER
  return {
    from: `"Organization Management" <${smtpUser}>`,
    replyTo: `"Support" <${smtpUser}>`, // Users see this when replying, keeping filters happy
    to,
    subject,
    html,
    headers: {
      'List-Unsubscribe': `<mailto:${smtpUser}?subject=unsubscribe>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      'X-Priority': '3',
      'X-MSMail-Priority': 'Normal',
      'Importance': 'Normal',
      'X-Auto-Response-Suppress': 'All',
      'Precedence': 'bulk' // Helps Google identify it as an automated transaction/notification rather than spam
    }
  };
};

export const sendOtpEmail = async (to: string, otpCode: string, name: string) => {
  const log = await logEmail({ to, subject: 'Your OTP Code', type: 'otp' });

  try {
    const transporter = await getTransporter();

    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified!');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your OTP Code</title>
      </head>
      <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f4;padding:20px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                <tr>
                  <td style="background:#4f46e5;padding:25px;text-align:center;">
                    <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:600;">Hello ${name}!</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px;">
                    <p style="font-size:16px;color:#333333;margin:0 0 20px;">
                      Thanks for registering! Use the code below to verify your email:
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:25px 0;">
                      <tr>
                        <td align="center">
                          <div style="background:#f0f0f0;padding:20px;border-radius:6px;display:inline-block;">
                            <span style="font-size:32px;font-weight:bold;color:#333333;letter-spacing:8px;font-family:Courier,monospace;">${otpCode}</span>
                          </div>
                        </td>
                      </tr>
                    </table>
                    <p style="font-size:14px;color:#666666;margin:0;">This code is valid for 10 minutes.</p>
                    <p style="font-size:14px;color:#666666;margin:20px 0 0;">If you didn't create this account, please ignore this email.</p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f9f9f9;padding:20px;text-align:center;">
                    <p style="font-size:12px;color:#999999;margin:0;">
                      Organization Management System<br>Addis Ababa, Ethiopia
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const mailOptions = buildMailOptions(to, 'Your OTP Verification Code', htmlContent);
    const info = await transporter.sendMail(mailOptions) as any;
    await updateEmailLog(log.id, 'sent');

    console.log('-----------------------------------------');
    console.log('✅ Email sent successfully!');
    console.log(`📧 To: ${to}`);
    console.log(`🔢 OTP CODE: ${otpCode}`);
    console.log(`📤 Message ID: ${info.messageId}`);
    console.log('-----------------------------------------');
    console.log('⚠️  If email not in inbox, check promotions/spam folder!');
    console.log('💡 Add sender to contacts!');

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('📧 Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    return info;
  } catch (error: any) {
    await updateEmailLog(log.id, 'failed', error.message);

    console.error('❌ Failed to send OTP email:', error);
    console.log('-----------------------------------------');
    console.log('� FALLBACK OTP FOR TESTING:');
    console.log(`📧 EMAIL: ${to}`);
    console.log(`🔢 OTP CODE: ${otpCode}`);
    console.log('-----------------------------------------');
    throw error;
  }
};

export const sendResetPasswordEmail = async (to: string, token: string, name: string) => {
  const log = await logEmail({ to, subject: 'Password Reset Request', type: 'password_reset' });

  try {
    const transporter = await getTransporter();
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}&email=${encodeURIComponent(to)}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #4f46e5;">Hello ${name},</h2>
        <p style="color: #475569; font-size: 16px;">We received a request to reset your password. Click the button below to choose a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Reset Password</a>
        </div>
        <p style="color: #64748b; font-size: 14px;">This link will expire in 1 hour.</p>
        <hr style="border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="color: #94a3b8; font-size: 12px;">If you didn't request a password reset, please safely ignore this email.</p>
      </div>
    `;

    const mailOptions = buildMailOptions(to, 'Password Reset Request', htmlContent);
    const info = await transporter.sendMail(mailOptions) as any;
    await updateEmailLog(log.id, 'sent');

    console.log('✅ Password Reset Email sent to %s', to);
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('📧 Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    return info;
  } catch (error: any) {
    await updateEmailLog(log.id, 'failed', error.message);
    console.error('❌ Failed to send Password Reset email to %s:', to, error);
    throw error;
  }
};

// Default features for different plan tiers (same as authController)
const defaultFeatures = {
  free: ['overview', 'members', 'contact', 'subscriptions', 'payments', 'file-sharing', 'profile'],
  pro: ['overview', 'members', 'events', 'services', 'news', 'chat', 'contact', 'subscriptions', 'payments', 'file-sharing', 'profile', 'tickets'],
  enterprise: ['overview', 'members', 'events', 'services', 'news', 'chat', 'contact', 'subscriptions', 'payments', 'file-sharing', 'reports', 'id-cards', 'licenses', 'profile', 'tickets']
};

export const sendWelcomeEmail = async (to: string, name: string, userId: string, role: string) => {
  const log = await logEmail({ to, subject: 'Welcome to Organization Management!', type: 'welcome', userId });

  try {
    const transporter = await getTransporter();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    let dashboardUrl = frontendUrl;
    let actionLinksHtml = '';
    let allowedFeatures: string[] = defaultFeatures.free;

    // Fetch user with organization and plan
    if (role === 'orgAdmin' || role === 'member') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { 
          organization: {
            include: { plan: true }
          }
        },
      });

      if (user?.organization) {
        let features: string[] = [];
        let planName = 'Free';
        
        if (user.organization.plan) {
          features = (user.organization.plan as any).allowed_features || [];
          planName = user.organization.plan.name;
        }
        
        if (!features || features.length === 0) {
          const nameLower = planName.toLowerCase();
          if (nameLower.includes('free')) {
            features = defaultFeatures.free;
          } else if (nameLower.includes('pro')) {
            features = defaultFeatures.pro;
          } else if (nameLower.includes('enterprise')) {
            features = defaultFeatures.enterprise;
          } else {
            features = defaultFeatures.free;
          }
        }

        allowedFeatures = features;
      }
    }

    if (role === 'orgAdmin') {
      dashboardUrl = `${frontendUrl}/org-admin/dashboard`;
      let links: string[] = [];

      // Profile link is always allowed? Or check 'profile' feature?
      links.push(`
        <tr><td style="padding-bottom:15px;">
          <a href="${frontendUrl}/org-admin/profile" style="display:inline-block;background:linear-gradient(135deg,#4f46e5 0%,#6366f1 100%);color:white;text-decoration:none;padding:12px 25px;border-radius:6px;font-weight:600;font-size:14px;">
            ✨ Complete Your Profile
          </a>
        </td></tr>
      `);

      if (allowedFeatures.includes('members')) {
        links.push(`
          <tr><td style="padding-bottom:15px;">
            <a href="${frontendUrl}/org-admin/members" style="display:inline-block;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:white;text-decoration:none;padding:12px 25px;border-radius:6px;font-weight:600;font-size:14px;">
              👥 Manage Your Members
            </a>
          </td></tr>
        `);
      }

      if (allowedFeatures.includes('events')) {
        links.push(`
          <tr><td style="padding-bottom:15px;">
            <a href="${frontendUrl}/org-admin/events" style="display:inline-block;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:white;text-decoration:none;padding:12px 25px;border-radius:6px;font-weight:600;font-size:14px;">
              📅 Create Events
            </a>
          </td></tr>
        `);
      }

      // Upgrade link is always there
      links.push(`
        <tr><td style="padding-bottom:15px;">
          <a href="${frontendUrl}/org-admin/upgrade" style="display:inline-block;background:linear-gradient(135deg,#ec4899 0%,#db2777 100%);color:white;text-decoration:none;padding:12px 25px;border-radius:6px;font-weight:600;font-size:14px;">
            💳 Upgrade Your Plan
          </a>
        </td></tr>
      `);

      actionLinksHtml = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${links.join('')}</table>`;
    } else if (role === 'member') {
      dashboardUrl = `${frontendUrl}/member/dashboard`;
      let links: string[] = [];

      links.push(`
        <tr><td style="padding-bottom:15px;">
          <a href="${frontendUrl}/member/profile" style="display:inline-block;background:linear-gradient(135deg,#4f46e5 0%,#6366f1 100%);color:white;text-decoration:none;padding:12px 25px;border-radius:6px;font-weight:600;font-size:14px;">
            ✨ Complete Your Profile
          </a>
        </td></tr>
      `);

      if (allowedFeatures.includes('events')) {
        links.push(`
          <tr><td style="padding-bottom:15px;">
            <a href="${frontendUrl}/member/events" style="display:inline-block;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:white;text-decoration:none;padding:12px 25px;border-radius:6px;font-weight:600;font-size:14px;">
              📅 Explore Events
            </a>
          </td></tr>
        `);
      }

      if (allowedFeatures.includes('services')) {
        links.push(`
          <tr><td style="padding-bottom:15px;">
            <a href="${frontendUrl}/member/services" style="display:inline-block;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:white;text-decoration:none;padding:12px 25px;border-radius:6px;font-weight:600;font-size:14px;">
              🛠️ Browse Services
            </a>
          </td></tr>
        `);
      }

      if (allowedFeatures.includes('subscriptions')) {
        links.push(`
          <tr><td style="padding-bottom:15px;">
            <a href="${frontendUrl}/member/subscriptions" style="display:inline-block;background:linear-gradient(135deg,#ec4899 0%,#db2777 100%);color:white;text-decoration:none;padding:12px 25px;border-radius:6px;font-weight:600;font-size:14px;">
              💳 Manage Subscriptions
            </a>
          </td></tr>
        `);
      }

      actionLinksHtml = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${links.join('')}</table>`;
    } else {
      dashboardUrl = `${frontendUrl}/super-admin`;
      actionLinksHtml = `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr><td style="padding-bottom:15px;">
            <a href="${frontendUrl}/super-admin" style="display:inline-block;background:linear-gradient(135deg,#4f46e5 0%,#6366f1 100%);color:white;text-decoration:none;padding:12px 25px;border-radius:6px;font-weight:600;font-size:14px;">
              🚀 Go to Admin Dashboard
            </a>
          </td></tr>
          <tr><td style="padding-bottom:15px;">
            <a href="${frontendUrl}/super-admin/organizations" style="display:inline-block;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:white;text-decoration:none;padding:12px 25px;border-radius:6px;font-weight:600;font-size:14px;">
              🏢 Manage Organizations
            </a>
          </td></tr>
          <tr><td style="padding-bottom:15px;">
            <a href="${frontendUrl}/super-admin/plans" style="display:inline-block;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:white;text-decoration:none;padding:12px 25px;border-radius:6px;font-weight:600;font-size:14px;">
              📦 Manage Plans
            </a>
          </td></tr>
        </table>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome!</title>
      </head>
      <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f4;padding:20px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                <tr>
                  <td style="background:#10b981;padding:25px;text-align:center;">
                    <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:600;">Welcome, ${name}! 🎉</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px;">
                    <p style="font-size:16px;color:#333333;margin:0 0 25px;">
                      Thanks for joining! Your account is now active and ready to use.
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:25px;">
                      <tr>
                        <td align="center">
                          <a href="${dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5 0%,#6366f1 100%);color:white;text-decoration:none;padding:15px 35px;border-radius:8px;font-weight:700;font-size:16px;box-shadow:0 4px 12px rgba(79,70,229,0.3);">
                            🎯 Go to Your Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>
                    <div style="background:#f8fafc;padding:20px;border-radius:6px;border:1px solid #e2e8f0;">
                      <h3 style="color:#1e293b;margin:0 0 20px;font-size:20px;font-weight:700;">Get Started:</h3>
                      ${actionLinksHtml}
                    </div>
                    <p style="font-size:14px;color:#666666;margin:30px 0 0;">
                      If you have any questions, feel free to reach out anytime!
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f9f9f9;padding:20px;text-align:center;">
                    <p style="font-size:12px;color:#999999;margin:0;">
                      Organization Management System<br>Addis Ababa, Ethiopia
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const mailOptions = buildMailOptions(to, 'Welcome to Organization Management!', htmlContent);
    const info = await transporter.sendMail(mailOptions) as any;
    await updateEmailLog(log.id, 'sent');

    console.log('✅ Welcome Email sent to %s (role: %s)', to, role);
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('📧 Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    return info;
  } catch (error: any) {
    await updateEmailLog(log.id, 'failed', error.message);
    console.error('❌ Failed to send welcome email:', error);
  }
};

export const sendPaymentConfirmationEmail = async (
  to: string,
  name: string,
  amount: number,
  planName: string,
  userId: string,
  paymentId: string
) => {
  const log = await logEmail({
    to,
    subject: 'Payment Confirmation',
    type: 'payment_confirmation',
    userId,
    paymentId
  });

  try {
    const transporter = await getTransporter();
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #059669;">Payment Confirmed! ✅</h2>
        <p style="color: #475569; font-size: 16px;">Hi ${name}, your payment has been successfully processed.</p>
        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #065f46; margin: 0 0 8px;"><strong>Plan:</strong> ${planName}</p>
          <p style="color: #065f46; margin: 0;"><strong>Amount:</strong> ${amount} ETB</p>
        </div>
        <p style="color: #94a3b8; font-size: 12px;">Thank you for your payment!</p>
      </div>
    `;

    const mailOptions = buildMailOptions(to, 'Payment Confirmation', htmlContent);
    const info = await transporter.sendMail(mailOptions) as any;
    await updateEmailLog(log.id, 'sent');

    console.log('✅ Payment Confirmation Email sent to %s', to);
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('📧 Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    return info;
  } catch (error: any) {
    await updateEmailLog(log.id, 'failed', error.message);
    console.error('❌ Failed to send payment confirmation email:', error);
  }
};

export const sendEventReminderEmail = async (
  to: string,
  name: string,
  eventTitle: string,
  eventDate: Date,
  eventLocation?: string | null,
  userId?: string,
  eventId?: string
) => {
  const log = await logEmail({
    to,
    subject: `Reminder: ${eventTitle}`,
    type: 'event_reminder',
    userId,
    eventId,
    scheduledAt: new Date()
  });

  try {
    const transporter = await getTransporter();
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #f59e0b;">Event Reminder! 📅</h2>
        <p style="color: #475569; font-size: 16px;">Hi ${name}, don't forget about the upcoming event!</p>
        <div style="background-color: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #92400e; margin: 0 0 8px;">${eventTitle}</h4>
          <p style="color: #78350f; margin: 0 0 8px;"><strong>Date:</strong> ${formattedDate}</p>
          ${eventLocation ? `<p style="color: #78350f; margin: 0;"><strong>Location:</strong> ${eventLocation}</p>` : ''}
        </div>
        <p style="color: #94a3b8; font-size: 12px;">We look forward to seeing you there!</p>
      </div>
    `;

    const mailOptions = buildMailOptions(to, `Reminder: ${eventTitle}`, htmlContent);
    const info = await transporter.sendMail(mailOptions) as any;
    await updateEmailLog(log.id, 'sent');

    console.log('✅ Event Reminder Email sent to %s', to);
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('📧 Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    return info;
  } catch (error: any) {
    await updateEmailLog(log.id, 'failed', error.message);
    console.error('❌ Failed to send event reminder email:', error);
  }
};

export const sendInvitationEmail = async (
  to: string,
  inviterName: string,
  organizationName: string,
  invitationLink: string
) => {
  const log = await logEmail({ to, subject: `Invitation to join ${organizationName}`, type: 'invitation' });

  try {
    const transporter = await getTransporter();
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #6366f1;">You're Invited! 🎉</h2>
        <p style="color: #475569; font-size: 16px;">Hi there! ${inviterName} has invited you to join ${organizationName} on OMMS.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invitationLink}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Accept Invitation</a>
        </div>
        <p style="color: #94a3b8; font-size: 12px;">If you don't want to accept this invitation, you can safely ignore this email.</p>
      </div>
    `;

    const mailOptions = buildMailOptions(to, `Invitation to join ${organizationName}`, htmlContent);
    const info = await transporter.sendMail(mailOptions) as any;
    await updateEmailLog(log.id, 'sent');

    console.log('✅ Invitation Email sent to %s', to);
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('📧 Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    return info;
  } catch (error: any) {
    await updateEmailLog(log.id, 'failed', error.message);
    console.error('❌ Failed to send invitation email:', error);
  }
};

export const sendNewMemberNotificationToOrgAdmin = async (
  to: string,
  orgAdminName: string,
  newMemberName: string,
  newMemberEmail: string,
  organizationName: string,
  userId?: string
) => {
  const log = await logEmail({
    to,
    subject: `New Member Joined ${organizationName}`,
    type: 'new_member',
    userId
  });

  try {
    const transporter = await getTransporter();
    const platformLink = process.env.FRONTEND_URL || 'http://localhost:5173';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #10b981;">New Member Alert! 🎉</h2>
        <p style="color: #475569; font-size: 16px;">Hi ${orgAdminName}, a new member has joined your organization ${organizationName}!</p>
        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #065f46; margin: 0 0 8px;"><strong>Name:</strong> ${newMemberName}</p>
          <p style="color: #065f46; margin: 0;"><strong>Email:</strong> ${newMemberEmail}</p>
        </div>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${platformLink}/org-admin/members" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">View Members</a>
        </div>
        <p style="color: #94a3b8; font-size: 12px;">You can manage this member in your dashboard.</p>
      </div>
    `;

    const mailOptions = buildMailOptions(to, `New Member Joined ${organizationName}`, htmlContent);
    const info = await transporter.sendMail(mailOptions) as any;
    await updateEmailLog(log.id, 'sent');

    console.log('✅ New member notification sent to org admin %s', to);
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('📧 Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    return info;
  } catch (error: any) {
    await updateEmailLog(log.id, 'failed', error.message);
    console.error('❌ Failed to send new member notification email:', error);
  }
};

export const sendNewOrgAdminNotificationToSuperAdmin = async (
  to: string,
  superAdminName: string,
  orgAdminName: string,
  orgAdminEmail: string,
  organizationName: string
) => {
  const log = await logEmail({
    to,
    subject: `New Organization Admin Registered for ${organizationName}`,
    type: 'new_org_admin',
  });

  try {
    const transporter = await getTransporter();
    const platformLink = process.env.FRONTEND_URL || 'http://localhost:5173';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #0ea5e9;">New Organization Admin Registered 📌</h2>
        <p style="color: #475569; font-size: 16px;">Hi ${superAdminName}, a new organization administrator has joined ${organizationName}.</p>
        <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #1d4ed8; margin: 0 0 8px;"><strong>Admin Name:</strong> ${orgAdminName}</p>
          <p style="color: #1d4ed8; margin: 0 0 8px;"><strong>Email:</strong> ${orgAdminEmail}</p>
          <p style="color: #1d4ed8; margin: 0;"><strong>Organization:</strong> ${organizationName}</p>
        </div>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${platformLink}/login" style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Open Super Admin Portal</a>
        </div>
        <p style="color: #94a3b8; font-size: 12px;">Log in to your Super Admin account to review and manage organization administrators.</p>
      </div>
    `;

    const mailOptions = buildMailOptions(to, `New Organization Admin Registered for ${organizationName}`, htmlContent);
    const info = await transporter.sendMail(mailOptions) as any;
    await updateEmailLog(log.id, 'sent');

    console.log('✅ New org admin notification sent to super admin %s', to);
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('📧 Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    return info;
  } catch (error: any) {
    await updateEmailLog(log.id, 'failed', error.message);
    console.error('❌ Failed to send new org admin notification email:', error);
  }
};

export const sendNewEventNotification = async (
  to: string,
  userName: string,
  eventTitle: string,
  eventDate: Date,
  eventLocation?: string | null,
  organizationName?: string,
  userId?: string,
  eventId?: string
) => {
  const log = await logEmail({
    to,
    subject: `New Event: ${eventTitle}`,
    type: 'new_event',
    userId,
    eventId
  });

  try {
    const transporter = await getTransporter();
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const platformLink = process.env.FRONTEND_URL || 'http://localhost:5173';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #6366f1;">New Event! 🎉</h2>
        <p style="color: #475569; font-size: 16px;">Hi ${userName}, ${organizationName ? `${organizationName} has a new event!` : 'there is a new event!'}.</p>
        <div style="background-color: #eef2ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #4338ca; margin: 0 0 8px;">${eventTitle}</h4>
          <p style="color: #3730a3; margin: 0 0 8px;"><strong>Date:</strong> ${formattedDate}</p>
          ${eventLocation ? `<p style="color: #3730a3; margin: 0;"><strong>Location:</strong> ${eventLocation}</p>` : ''}
        </div>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${platformLink}/${organizationName ? 'org-admin' : 'super-admin'}/events" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">View Event</a>
        </div>
      </div>
    `;

    const mailOptions = buildMailOptions(to, `New Event: ${eventTitle}`, htmlContent);
    const info = await transporter.sendMail(mailOptions) as any;
    await updateEmailLog(log.id, 'sent');

    console.log('✅ New event notification sent to %s', to);
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('📧 Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    return info;
  } catch (error: any) {
    await updateEmailLog(log.id, 'failed', error.message);
    console.error('❌ Failed to send new event notification email:', error);
  }
};

export const sendNewServiceNotification = async (
  to: string,
  userName: string,
  serviceName: string,
  serviceDescription: string,
  organizationName?: string,
  userId?: string
) => {
  const log = await logEmail({
    to,
    subject: `New Service: ${serviceName}`,
    type: 'new_service',
    userId
  });

  try {
    const transporter = await getTransporter();
    const platformLink = process.env.FRONTEND_URL || 'http://localhost:5173';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #f59e0b;">New Service Available! 🛠️</h2>
        <p style="color: #475569; font-size: 16px;">Hi ${userName}, ${organizationName ? `${organizationName} has a new service available!` : 'there is a new service available!'}.</p>
        <div style="background-color: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #92400e; margin: 0 0 8px;">${serviceName}</h4>
          <p style="color: #78350f; margin: 0;">${serviceDescription}</p>
        </div>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${platformLink}/${organizationName ? 'org-admin' : 'super-admin'}/services" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">View Service</a>
        </div>
      </div>
    `;

    const mailOptions = buildMailOptions(to, `New Service: ${serviceName}`, htmlContent);
    const info = await transporter.sendMail(mailOptions) as any;
    await updateEmailLog(log.id, 'sent');

    console.log('✅ New service notification sent to %s', to);
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('📧 Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    return info;
  } catch (error: any) {
    await updateEmailLog(log.id, 'failed', error.message);
    console.error('❌ Failed to send new service notification email:', error);
  }
};

export const sendReportNotification = async (
  to: string,
  userName: string,
  reportTitle: string,
  reportType: string,
  reportStatus: string,
  organizationName: string,
  userId?: string
) => {
  const log = await logEmail({
    to,
    subject: `New Report: ${reportTitle}`,
    type: 'new_report',
    userId
  });

  try {
    const transporter = await getTransporter();
    const platformLink = process.env.FRONTEND_URL || 'http://localhost:5173';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #ef4444;">New Report! 📋</h2>
        <p style="color: #475569; font-size: 16px;">Hi ${userName}, a new report has been submitted!</p>
        <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #991b1b; margin: 0 0 8px;"><strong>Title:</strong> ${reportTitle}</p>
          <p style="color: #991b1b; margin: 0 0 8px;"><strong>Type:</strong> ${reportType}</p>
          <p style="color: #991b1b; margin: 0;"><strong>Status:</strong> ${reportStatus}</p>
        </div>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${platformLink}/org-admin/reports" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">View Report</a>
        </div>
      </div>
    `;

    const mailOptions = buildMailOptions(to, `New Report: ${reportTitle}`, htmlContent);
    const info = await transporter.sendMail(mailOptions) as any;
    await updateEmailLog(log.id, 'sent');

    console.log('✅ Report notification sent to %s', to);
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('📧 Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    return info;
  } catch (error: any) {
    await updateEmailLog(log.id, 'failed', error.message);
    console.error('❌ Failed to send report notification email:', error);
  }
};

export const sendIdCardNotification = async (
  to: string,
  userName: string,
  idCardStatus: string,
  organizationName: string,
  userId?: string
) => {
  const log = await logEmail({
    to,
    subject: `ID Card Update: ${idCardStatus}`,
    type: 'id_card',
    userId
  });

  try {
    const transporter = await getTransporter();
    const platformLink = process.env.FRONTEND_URL || 'http://localhost:5173';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #8b5cf6;">ID Card Update! 🪪</h2>
        <p style="color: #475569; font-size: 16px;">Hi ${userName}, your ID card status has been updated to: ${idCardStatus}</p>
        <div style="background-color: #f5f3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #6d28d9; margin: 0;"><strong>Organization:</strong> ${organizationName}</p>
        </div>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${platformLink}/member/id-card" style="background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">View ID Card</a>
        </div>
      </div>
    `;

    const mailOptions = buildMailOptions(to, `ID Card Update: ${idCardStatus}`, htmlContent);
    const info = await transporter.sendMail(mailOptions) as any;
    await updateEmailLog(log.id, 'sent');

    console.log('✅ ID card notification sent to %s', to);
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('📧 Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    return info;
  } catch (error: any) {
    await updateEmailLog(log.id, 'failed', error.message);
    console.error('❌ Failed to send ID card notification email:', error);
  }
};
