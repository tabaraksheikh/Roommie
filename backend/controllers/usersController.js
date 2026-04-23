/**
 * usersController
 * ──────────────────────────────────────────────────────────────
 * HTTP adapter for user-profile operations.
 */
const usersService = require('../services/usersService');
const catchAsync   = require('../utils/catchAsync');

/** GET /api/users/me */
const getMe = catchAsync(async (req, res) => {
  const user = await usersService.getMe(req.user.id);
  res.json({ user });
});

/** PUT /api/users/me */
const updateMe = catchAsync(async (req, res) => {
  const { firstName, lastName, gender, bio } = req.body;
  const user = await usersService.updateMe(req.user.id, {
    firstName, lastName, gender, bio,
  });
  res.json({ message: 'Profile updated', user });
});

/** GET /api/users/:id */
const getUserById = catchAsync(async (req, res) => {
  const result = await usersService.getUserById(req.params.id);
  res.json(result);
});

module.exports = { getMe, updateMe, getUserById };
