/**
 * usersService
 * ──────────────────────────────────────────────────────────────
 * Business-logic layer for user profiles.
 */
const userModel = require('../models/userModel');
const AppError  = require('../utils/AppError');

const ALLOWED_GENDERS = new Set(['', 'Male', 'Female']);

/** Format a DB user row into the standard API response shape */
function formatUser(user, extra = {}) {
  return {
    id:        user.id,
    email:     user.email,
    firstName: user.first_name,
    lastName:  user.last_name,
    fullName:  `${user.first_name} ${user.last_name}`.trim() || user.email,
    gender:    user.gender,
    bio:       user.bio,
    ...extra,
  };
}

/** Return the authenticated user's own profile */
async function getMe(userId) {
  const user = await userModel.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  return formatUser(user);
}

/** Update the authenticated user's profile fields */
async function updateMe(userId, { firstName, lastName, gender, bio }) {
  const normalizedGender = gender !== undefined ? String(gender).trim() : undefined;
  if (normalizedGender !== undefined && !ALLOWED_GENDERS.has(normalizedGender)) {
    throw new AppError('Gender must be Male or Female', 400);
  }

  const updated = await userModel.updateUser(userId, {
    firstName: firstName !== undefined ? firstName.trim() : undefined,
    lastName:  lastName  !== undefined ? lastName.trim()  : undefined,
    gender: normalizedGender,
    bio,
  });
  if (!updated) throw new AppError('User not found', 404);
  return formatUser(updated);
}

/** Return a public user profile + their active listings */
async function getUserById(userId) {
  const user = await userModel.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  const listings = await userModel.findUserListings(userId);

  return {
    user: formatUser(user),
    listings,
  };
}

module.exports = { getMe, updateMe, getUserById };
