const crypto = require('crypto');
const otpModel = require('../models/otpModel');
const AppError = require('../utils/AppError');

const OTP_TTL_MINUTES = 10;

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

async function saveOtp(email, purpose, payload) {
  const normalizedEmail = email.toLowerCase().trim();
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await otpModel.replacePendingOtp({
    email: normalizedEmail,
    purpose,
    otp,
    payload,
    expiresAt,
  });

  return otp;
}

async function verifyOtp(email, purpose, code) {
  const normalizedEmail = email.toLowerCase().trim();
  const entry = await otpModel.findLatestPendingOtp(normalizedEmail, purpose);

  if (!entry) {
    throw new AppError('No verification code found. Please request a new one.', 400);
  }

  if (new Date(entry.expires_at).getTime() < Date.now()) {
    await otpModel.markOtpUsed(entry.id);
    throw new AppError('Verification code has expired. Please request a new one.', 400);
  }

  if (entry.otp_code !== String(code).trim()) {
    throw new AppError('Incorrect verification code. Please try again.', 400);
  }

  await otpModel.markOtpUsed(entry.id);

  try {
    return entry.payload_json ? JSON.parse(entry.payload_json) : {};
  } catch {
    return {};
  }
}

module.exports = { saveOtp, verifyOtp, OTP_TTL_MINUTES };
