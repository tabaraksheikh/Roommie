/**
 * authService
 * ──────────────────────────────────────────────────────────────
 * Business-logic layer for authentication.
 * Talks to userModel; never touches HTTP or res/req.
 */
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const userModel = require('../models/userModel');
const AppError  = require('../utils/AppError');

/** Sign a JWT for the given userId */
function generateToken(userId) {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/** Register a new account; returns { token, user } */
async function register({ email, password, firstName, lastName }) {
  if (!email || !password)  throw new AppError('Email and password are required', 400);
  if (password.length < 8)  throw new AppError('Password must be at least 8 characters', 400);

  const normalizedEmail = email.toLowerCase().trim();

  const existing = await userModel.findByEmail(normalizedEmail);
  if (existing)  throw new AppError('Email already registered', 409);

  const hashedPassword = bcrypt.hashSync(password, 10);
  const user = await userModel.createUser({
    email:          normalizedEmail,
    hashedPassword,
    firstName:      (firstName || '').trim(),
    lastName:       (lastName  || '').trim(),
  });

  return { token: generateToken(user.id), user };
}

/** Log in; returns { token, user } */
async function login({ email, password }) {
  if (!email || !password)  throw new AppError('Email and password are required', 400);

  const user = await userModel.findByEmail(email.toLowerCase().trim());
  if (!user)  throw new AppError('Invalid email or password', 401);

  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch)  throw new AppError('Invalid email or password', 401);

  return { token: generateToken(user.id), user };
}

/** Change password after verifying the current one */
async function changePassword(userId, { currentPassword, newPassword }) {
  if (!currentPassword || !newPassword) {
    throw new AppError('Current and new password are required', 400);
  }
  if (newPassword.length < 8) {
    throw new AppError('New password must be at least 8 characters', 400);
  }

  const user    = await userModel.findByIdWithPassword(userId);
  const isMatch = bcrypt.compareSync(currentPassword, user.password);
  if (!isMatch)  throw new AppError('Current password is incorrect', 401);

  await userModel.updatePassword(userId, bcrypt.hashSync(newPassword, 10));
}

async function resetPassword(userId, newPassword) {
  if (!newPassword) throw new AppError('New password is required', 400);
  if (newPassword.length < 8) {
    throw new AppError('New password must be at least 8 characters', 400);
  }

  const user = await userModel.findByIdWithPassword(userId);
  if (!user) throw new AppError('User not found', 404);

  await userModel.updatePassword(userId, bcrypt.hashSync(newPassword, 10));
}

async function changeEmail(userId, newEmail) {
  const normalizedEmail = (newEmail || '').toLowerCase().trim();
  if (!normalizedEmail) throw new AppError('New email is required', 400);

  const existing = await userModel.findByEmail(normalizedEmail);
  if (existing && existing.id !== userId) {
    throw new AppError('Email already registered', 409);
  }

  return userModel.updateEmail(userId, normalizedEmail);
}

/** Delete the user's account entirely */
async function deleteAccount(userId) {
  await userModel.deleteUser(userId);
}

module.exports = {
  register,
  login,
  changePassword,
  resetPassword,
  changeEmail,
  deleteAccount,
};
