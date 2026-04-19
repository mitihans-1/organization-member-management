import nodemailer from 'nodemailer';

export const sendOtpEmail = async (to: string, otpCode: string, name: string) => {
  try {
    // Note: For MVP/development, if no SMTP credentials are provided in .env,
    // we dynamically create a fake Ethereal account for testing.
    let transporter;
    
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      console.log('No SMTP credentials found. Creating a test Ethereal account...');
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user, // generated ethereal user
          pass: testAccount.pass, // generated ethereal password
        },
      });
    }

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
    console.log('OTP Email sent: %s', info.messageId);
    
    // Always print the Ethereal URL if we aren't using real credentials
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('Error sending OTP email:', error);
    // Depending on your setup, you might want to throw the error to handle it in the controller
    // throw new Error('Could not send OTP email');
  }
};

export const sendResetPasswordEmail = async (to: string, token: string, name: string) => {
  try {
    let transporter;
    
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const resetLink = `http://localhost:5174/reset-password?token=${token}&email=${encodeURIComponent(to)}`;

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
    console.log('Password Reset Email sent: %s', info.messageId);
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('Error sending Password Reset email:', error);
  }
};
