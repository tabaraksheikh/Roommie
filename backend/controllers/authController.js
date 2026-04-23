/**
 * authController
 * ──────────────────────────────────────────────────────────────
 * HTTP adapter for auth operations.
 * Reads from req, calls the service, writes to res.
 * No business logic, no SQL here.
 */
const authService    = require('../services/authService');
const emailService   = require('../services/emailService');
const otpStore       = require('../services/otpStore');
const catchAsync     = require('../utils/catchAsync');
const AppError       = require('../utils/AppError');
const userModel      = require('../models/userModel');

/**
 * POST /api/auth/send-verification
 * Step 1 of registration: validates input, sends OTP to email.
 * Does NOT create the account yet.
 */
const sendVerification = catchAsync(async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password)      throw new AppError('Email and password are required', 400);
  if (password.length < 8)      throw new AppError('Password must be at least 8 characters', 400);

  const normalizedEmail = email.toLowerCase().trim();

  // Check if email is already registered
  const existing = await userModel.findByEmail(normalizedEmail);
  if (existing) throw new AppError('Email already registered', 409);

  // Save the registration payload in the OTP store and send code
  const otp = await otpStore.saveOtp(normalizedEmail, 'registration', {
    email:     normalizedEmail,
    password,
    firstName: (firstName || '').trim(),
    lastName:  (lastName  || '').trim(),
  });

  await emailService.sendOtpEmail(normalizedEmail, otp, 'registration');

  res.json({ message: 'Verification code sent to your email' });
});

/**
 * POST /api/auth/verify-email
 * Step 2 of registration: verifies the OTP and creates the account.
 */
const verifyEmail = catchAsync(async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) throw new AppError('Email and verification code are required', 400);

  // verifyOtp throws if code is wrong or expired; returns the payload on success
  const payload = await otpStore.verifyOtp(email.toLowerCase().trim(), 'registration', code);

  const { token, user } = await authService.register(payload);
  res.status(201).json({ message: 'Account created successfully', token, user });
});

/** POST /api/auth/login */
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const { token, user } = await authService.login({ email, password });
  res.json({ message: 'Login successful', token, user });
});

/** GET /api/auth/me  (req.user set by requireAuth middleware) */
const getMe = (req, res) => {
  const u = req.user;
  res.json({
    user: {
      id:        u.id,
      email:     u.email,
      firstName: u.first_name,
      lastName:  u.last_name,
      fullName:  `${u.first_name} ${u.last_name}`.trim() || u.email,
      gender:    u.gender,
      bio:       u.bio,
    },
  });
};

/** PUT /api/auth/password */
const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, { currentPassword, newPassword });
  res.json({ message: 'Password updated successfully' });
});

const requestEmailChange = catchAsync(async (req, res) => {
  const newEmail = (req.body.newEmail || '').toLowerCase().trim();
  if (!newEmail) throw new AppError('New email is required', 400);
  if (newEmail === req.user.email.toLowerCase()) {
    throw new AppError('Please enter a different email address', 400);
  }

  const existing = await userModel.findByEmail(newEmail);
  if (existing && existing.id !== req.user.id) {
    throw new AppError('Email already registered', 409);
  }

  const otp = await otpStore.saveOtp(newEmail, 'email_change', {
    userId: req.user.id,
    newEmail,
  });

  await emailService.sendOtpEmail(newEmail, otp, 'email_change');
  res.json({ message: 'Verification code sent to your new email' });
});

const confirmEmailChange = catchAsync(async (req, res) => {
  const newEmail = (req.body.newEmail || '').toLowerCase().trim();
  const code = req.body.code;

  if (!newEmail || !code) {
    throw new AppError('New email and verification code are required', 400);
  }

  const payload = await otpStore.verifyOtp(newEmail, 'email_change', code);
  if (payload.userId !== req.user.id || payload.newEmail !== newEmail) {
    throw new AppError('This verification code is not valid for this account', 403);
  }

  const user = await authService.changeEmail(req.user.id, newEmail);
  res.json({
    message: 'Email updated successfully',
    user: {
      id:        user.id,
      email:     user.email,
      firstName: user.first_name,
      lastName:  user.last_name,
      fullName:  `${user.first_name} ${user.last_name}`.trim() || user.email,
      gender:    user.gender,
      bio:       user.bio,
    },
  });
});

const requestPasswordReset = catchAsync(async (req, res) => {
  const email = (req.body.email || '').toLowerCase().trim();
  if (!email) throw new AppError('Email is required', 400);

  const user = await userModel.findByEmail(email);
  if (user) {
    const otp = await otpStore.saveOtp(email, 'password_reset', {
      userId: user.id,
      email,
    });
    await emailService.sendOtpEmail(email, otp, 'password_reset');
  }

  res.json({ message: 'If an account exists for that email, a verification code has been sent.' });
});

const resetPassword = catchAsync(async (req, res) => {
  const email = (req.body.email || '').toLowerCase().trim();
  const { code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    throw new AppError('Email, verification code, and new password are required', 400);
  }

  const payload = await otpStore.verifyOtp(email, 'password_reset', code);
  if (payload.email !== email) {
    throw new AppError('This verification code is not valid for that email', 400);
  }

  await authService.resetPassword(payload.userId, newPassword);
  res.json({ message: 'Password reset successfully' });
});

/** DELETE /api/auth/account */
const deleteAccount = catchAsync(async (req, res) => {
  await authService.deleteAccount(req.user.id);
  res.json({ message: 'Account deleted successfully' });
});

module.exports = {
  sendVerification,
  verifyEmail,
  login,
  getMe,
  changePassword,
  requestEmailChange,
  confirmEmailChange,
  requestPasswordReset,
  resetPassword,
  deleteAccount,
};
