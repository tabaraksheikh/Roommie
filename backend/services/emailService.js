/**
 * emailService.js
 * ─────────────────────────────────────────────────────────────
 * Sends transactional emails via Gmail SMTP using nodemailer.
 * Requires SMTP_USER and SMTP_PASS in .env
 */
const nodemailer = require('nodemailer');
const AppError   = require('../utils/AppError');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

function getOtpEmailCopy(type) {
  if (type === 'password_reset') {
    return {
      subject: 'Your Roommie Password Reset Code',
      title: 'Reset your password',
      message: 'Use the code below to reset your Roommie password. It expires in <strong>10 minutes</strong>.',
    };
  }
  if (type === 'email_change') {
    return {
      subject: 'Confirm Your New Roommie Email',
      title: 'Confirm your new email',
      message: 'Use the code below to confirm your new Roommie email address. It expires in <strong>10 minutes</strong>.',
    };
  }
  return {
    subject: 'Your Roommie Verification Code',
    title: 'Verify your email',
    message: 'Use the code below to complete your Roommie registration. It expires in <strong>10 minutes</strong>.',
  };
}

async function sendOtpEmail(toEmail, otp, type = 'registration') {
  const from = process.env.SMTP_USER;
  const copy = getOtpEmailCopy(type);

  if (!from || !process.env.SMTP_PASS) {
    console.log(`\n[EMAIL DEV FALLBACK] ${type} code for ${toEmail}: ${otp}\n`);
    return;
  }

  const mailOptions = {
    from: `"Roommie" <${from}>`,
    to: toEmail,
    subject: copy.subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 12px;">
        <h2 style="color: #1a1a2e; margin-bottom: 8px;">${copy.title}</h2>
        <p style="color: #555; margin-bottom: 24px;">${copy.message}</p>
        <div style="background: #ffffff; border: 2px solid #e0e0e0; border-radius: 8px; padding: 24px; text-align: center; letter-spacing: 10px; font-size: 36px; font-weight: bold; color: #1a1a2e;">
          ${otp}
        </div>
        <p style="color: #aaa; font-size: 13px; margin-top: 24px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  };

  try {
    await getTransporter().sendMail(mailOptions);
  } catch (err) {
    console.error('[EMAIL ERROR]', err.message || err);
    // Reset transporter so next attempt creates a fresh connection
    transporter = null;
    throw new AppError('Failed to send verification email. Please check your email address and try again.', 500);
  }
}

module.exports = { sendOtpEmail };
