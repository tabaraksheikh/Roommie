const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const authService = require('../backend/services/authService');
const userModel = require('../backend/models/userModel');
const AppError = require('../backend/utils/AppError');

function patch(object, key, value) {
  const original = object[key];
  object[key] = value;
  return () => {
    object[key] = original;
  };
}

test('authService.login rejects invalid password', async () => {
  const restore = patch(userModel, 'findByEmail', async () => ({
    id: 7,
    email: 'user@example.com',
    password: bcrypt.hashSync('correct-password', 10),
  }));

  try {
    await assert.rejects(
      () => authService.login({ email: 'user@example.com', password: 'wrong-password' }),
      (error) => error instanceof AppError && error.statusCode === 401
    );
  } finally {
    restore();
  }
});

test('authService.register normalizes email before creating the user', async () => {
  const restores = [
    patch(userModel, 'findByEmail', async () => null),
  ];

  let createdPayload = null;
  restores.push(
    patch(userModel, 'createUser', async (payload) => {
      createdPayload = payload;
      return { id: 10, email: payload.email, first_name: payload.firstName, last_name: payload.lastName };
    })
  );

  try {
    const result = await authService.register({
      email: '  TEST@Example.com ',
      password: 'strong-pass',
      firstName: 'Test',
      lastName: 'User',
    });

    assert.equal(createdPayload.email, 'test@example.com');
    assert.equal(result.user.email, 'test@example.com');
    assert.ok(result.token);
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});
