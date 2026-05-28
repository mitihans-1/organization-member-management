import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getTransporter = async () => {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const isGmail = process.env.SMTP_HOST?.includes('gmail');
    return nodemailer.createTransport(isGmail ? {
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
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
  const log = await prisma.emailNotificationLog.create({
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
  return log;
};

const updateEmailLog = async (logId: string, status: 'sent' | 'failed', error?: string) => {
  const log = await prisma.emailNotificationLog.update({
    where: { id: logId },
    data: {
      status,
      error,
      sentAt: status === 'sent' ? new Date() : undefined,
    },
  });
  return log;
};

export const sendOtpEmail = async (to: string, otpCode: string, name: string) => {
  const log = await logEmail({
    to,
    subject: 'Your Registration OTP Code',
    type: 'otp'
  });

  try {
    const transporter = await getTransporter();

    const mailOptions = {
      from: `"Organization Management" <${process.env.SMTP_USER || 'noreply@orgmanagement.com'}>`,
      to,
      subject: 'Your Registration OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-w-lg; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #4f46e5;">Welcome, ${name}!</h2>
          <p style="color: #475569; font-size: 16px;">Thank you for registering. To complete your account setup, please use the following One-Time Password (OTP):</p>
          <div style="background-color: #f1f5f9; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b;">${otpCode}</span>
          </div>
          <p style="color: #64748b; font-size: 14px;">This code will expire in 10 minutes.</p>
          <hr style="border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 12px;">If you did not request this code, please ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    await updateEmailLog(log.id, 'sent');
    
    console.log('-----------------------------------------');
    console.log(`OTP Email successfully sent to ${to}`);
    console.log(`OTP CODE: ${otpCode}`);
    console.log('-----------------------------------------');
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    return info;
  } catch (error: any) {
    await updateEmailLog(log.id, 'failed', error.message);
    
    console.error('CRITICAL: Failed to send OTP email to %s:', to, error);
    console.log('-----------------------------------------');
    console.log('FALLBACK OTP FOR TESTING:');
    console.log(`EMAIL: ${to}`);
    console.log(`OTP CODE: ${otpCode}`);
    console.log('-----------------------------------------');
    throw error;
  }
};

export const sendResetPasswordEmail = async (to: string, token: string, name: string) => {
  const log = await logEmail({
    to,
    subject: 'Password Reset Request',
    type: 'password_reset'
  });

  try {
    const transporter = await getTransporter();
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}&email=${encodeURIComponent(to)}`;

    const mailOptions = {
      from: `"Organization Management" <${process.env.SMTP_USER || 'noreply@orgmanagement.com'}>`,
      to,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-w-lg; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #4f46e5;">Hello ${name},</h2>
          <p style="color: #475569; font-size: 16px;">We received a request to reset your password. Click the button below to choose a new password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Reset Password</a>
          </div>

          <p style="color: #64748b; font-size: 14px;">This link will expire in 1 hour.</p>
          <hr style="border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 12px;">If you did not request a password reset, please safely ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    await updateEmailLog(log.id, 'sent');
    
    console.log('Password Reset Email successfully sent to %s: %s', to, info.messageId);
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    return info;
  } catch (error: any) {
    await updateEmailLog(log.id, 'failed', error.message);
    console.error('CRITICAL: Failed to send Password Reset email to %s:', to, error);
    throw error;
  }
};

export const sendWelcomeEmail = async (to: string, name: string, userId: string) => {
  const log = await logEmail({
    to,
    subject: 'Welcome to OMMS!',
    type: 'welcome',
    userId
  });

  try {
    const transporter = await getTransporter();

    const mailOptions = {
      from: `"Organization Management" <${process.env.SMTP_USER || 'noreply@orgmanagement.com'}>`,
      to,
      subject: 'Welcome to OMMS!',
      html: `
        <div style="font-family: Arial, sans-serif; max-w-lg; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #10b981;">Welcome aboard, ${name}! 🎉</h2>
          <p style="color: #475569; font-size: 16px;">Thank you for joining OMMS. Your account is now active and ready to use!</p>
          
          <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #065f46; margin: 0 0 8px;">What's Next?</h4>
            <ul style="color: #047857; font-size: 14px; margin: 0; padding-left: 20px;">
              <li>Complete your profile</li>
              <li>Explore events and services</li>
              <li>Connect with other members</li>
            </ul>
          </div>

          <p style="color: #94a3b8; font-size: 12px;">If you have any questions, feel free to contact our support team.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    await updateEmailLog(log.id, 'sent');
    console.log('Welcome Email sent to %s', to);
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    return info;
  } catch (error: any) {
    await updateEmailLog(log.id, 'failed', error.message);
    console.error('Failed to send welcome email:', error);
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

    const mailOptions = {
      from: `"Organization Management" <${process.env.SMTP_USER || 'noreply@orgmanagement.com'}>`,
      to,
      subject: 'Payment Confirmation',
      html: `
        <div style="font-family: Arial, sans-serif; max-w-lg; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #059669;">Payment Confirmed! ✅</h2>
          <p style="color: #475569; font-size: 16px;">Hi ${name}, your payment has been successfully processed.</p>
          
          <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #065f46; margin: 0 0 8px;"><strong>Plan:</strong> ${planName}</p>
            <p style="color: #065f46; margin: 0;"><strong>Amount:</strong> ${amount} ETB</p>
          </div>

          <p style="color: #94a3b8; font-size: 12px;">Thank you for your payment!</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    await updateEmailLog(log.id, 'sent');
    console.log('Payment Confirmation Email sent to %s', to);
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    return info;
  } catch (error: any) {
    await updateEmailLog(log.id, 'failed', error.message);
    console.error('Failed to send payment confirmation email:', error);
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

    const mailOptions = {
      from: `"Organization Management" <${process.env.SMTP_USER || 'noreply@orgmanagement.com'}>`,
      to,
      subject: `Reminder: ${eventTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-w-lg; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #f59e0b;">Event Reminder! 📅</h2>
          <p style="color: #475569; font-size: 16px;">Hi ${name}, don't forget about the upcoming event!</p>
          
          <div style="background-color: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #92400e; margin: 0 0 8px;">${eventTitle}</h4>
            <p style="color: #78350f; margin: 0 0 8px;"><strong>Date:</strong> ${formattedDate}</p>
            ${eventLocation ? `<p style="color: #78350f; margin: 0;"><strong>Location:</strong> ${eventLocation}</p>` : ''}
          </div>

          <p style="color: #94a3b8; font-size: 12px;">We look forward to seeing you there!</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    await updateEmailLog(log.id, 'sent');
    console.log('Event Reminder Email sent to %s', to);
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    return info;
  } catch (error: any) {
    await updateEmailLog(log.id, 'failed', error.message);
    console.error('Failed to send event reminder email:', error);
  }
};

export const sendInvitationEmail = async (
  to: string,
  inviterName: string,
  organizationName: string,
  invitationLink: string
) => {
  const log = await logEmail({
    to,
    subject: `Invitation to join ${organizationName}`,
    type: 'invitation'
  });

  try {
    const transporter = await getTransporter();

    const mailOptions = {
      from: `"Organization Management" <${process.env.SMTP_USER || 'noreply@orgmanagement.com'}>`,
      to,
      subject: `Invitation to join ${organizationName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-w-lg; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #6366f1;">You're Invited! 🎉</h2>
          <p style="color: #475569; font-size: 16px;">Hi there! ${inviterName} has invited you to join ${organizationName} on OMMS.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationLink}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Accept Invitation</a>
          </div>

          <p style="color: #94a3b8; font-size: 12px;">If you don't want to accept this invitation, you can safely ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    await updateEmailLog(log.id, 'sent');
    console.log('Invitation Email sent to %s', to);
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    return info;
  } catch (error: any) {
    await updateEmailLog(log.id, 'failed', error.message);
    console.error('Failed to send invitation email:', error);
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
    userId,
  });

  try {
    const transporter = await getTransporter();
    const platformLink = process.env.FRONTEND_URL || 'http://localhost:5173';

    const mailOptions = {
      from: `"Organization Management" <${process.env.SMTP_USER || 'noreply@orgmanagement.com'}>`,
      to,
      subject: `New Member Joined ${organizationName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-w-lg; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
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
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    await updateEmailLog(log.id, 'sent');
    console.log('New member notification sent to org admin %s', to);
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    return info;
  } catch (error: any) {
    await updateEmailLog(log.id, 'failed', error.message);
    console.error('Failed to send new member notification email:', error);
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
    eventId,
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

    const mailOptions = {
      from: `"Organization Management" <${process.env.SMTP_USER || 'noreply@orgmanagement.com'}>`,
      to,
      subject: `New Event: ${eventTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-w-lg; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #6366f1;">New Event! 🎉</h2>
          <p style="color: #475569; font-size: 16px;">Hi ${userName}, ${organizationName ? `${organizationName} has a new event!` : 'there is a new event!'}</p>
          
          <div style="background-color: #eef2ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #4338ca; margin: 0 0 8px;">${eventTitle}</h4>
            <p style="color: #3730a3; margin: 0 0 8px;"><strong>Date:</strong> ${formattedDate}</p>
            ${eventLocation ? `<p style="color: #3730a3; margin: 0;"><strong>Location:</strong> ${eventLocation}</p>` : ''}
          </div>

          <div style="text-align: center; margin: 20px 0;">
            <a href="${platformLink}/${organizationName ? 'org-admin' : 'super-admin'}/events" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">View Event</a>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    await updateEmailLog(log.id, 'sent');
    console.log('New event notification sent to %s', to);
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    return info;
  } catch (error: any) {
    await updateEmailLog(log.id, 'failed', error.message);
    console.error('Failed to send new event notification email:', error);
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
    userId,
  });

  try {
    const transporter = await getTransporter();
    const platformLink = process.env.FRONTEND_URL || 'http://localhost:5173';

    const mailOptions = {
      from: `"Organization Management" <${process.env.SMTP_USER || 'noreply@orgmanagement.com'}>`,
      to,
      subject: `New Service: ${serviceName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-w-lg; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #f59e0b;">New Service Available! 🛠️</h2>
          <p style="color: #475569; font-size: 16px;">Hi ${userName}, ${organizationName ? `${organizationName} has a new service available!` : 'there is a new service available!'}</p>
          
          <div style="background-color: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #92400e; margin: 0 0 8px;">${serviceName}</h4>
            <p style="color: #78350f; margin: 0;">${serviceDescription}</p>
          </div>

          <div style="text-align: center; margin: 20px 0;">
            <a href="${platformLink}/${organizationName ? 'org-admin' : 'super-admin'}/services" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">View Service</a>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    await updateEmailLog(log.id, 'sent');
    console.log('New service notification sent to %s', to);
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    return info;
  } catch (error: any) {
    await updateEmailLog(log.id, 'failed', error.message);
    console.error('Failed to send new service notification email:', error);
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
    userId,
  });

  try {
    const transporter = await getTransporter();
    const platformLink = process.env.FRONTEND_URL || 'http://localhost:5173';

    const mailOptions = {
      from: `"Organization Management" <${process.env.SMTP_USER || 'noreply@orgmanagement.com'}>`,
      to,
      subject: `New Report: ${reportTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-w-lg; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
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
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    await updateEmailLog(log.id, 'sent');
    console.log('Report notification sent to %s', to);
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    return info;
  } catch (error: any) {
    await updateEmailLog(log.id, 'failed', error.message);
    console.error('Failed to send report notification email:', error);
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
    userId,
  });

  try {
    const transporter = await getTransporter();
    const platformLink = process.env.FRONTEND_URL || 'http://localhost:5173';

    const mailOptions = {
      from: `"Organization Management" <${process.env.SMTP_USER || 'noreply@orgmanagement.com'}>`,
      to,
      subject: `ID Card Update: ${idCardStatus}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-w-lg; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #8b5cf6;">ID Card Update! 🪪</h2>
          <p style="color: #475569; font-size: 16px;">Hi ${userName}, your ID card status has been updated to: ${idCardStatus}</p>
          
          <div style="background-color: #f5f3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #6d28d9; margin: 0;"><strong>Organization:</strong> ${organizationName}</p>
          </div>

          <div style="text-align: center; margin: 20px 0;">
            <a href="${platformLink}/member/id-card" style="background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">View ID Card</a>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    await updateEmailLog(log.id, 'sent');
    console.log('ID card notification sent to %s', to);
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    return info;
  } catch (error: any) {
    await updateEmailLog(log.id, 'failed', error.message);
    console.error('Failed to send ID card notification email:', error);
  }
};
