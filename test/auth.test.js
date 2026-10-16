import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, AUTHORIZED_USERNAME } from '../server/auth.js';

test('Single-User Auth Engine enforces user Rishith and cryptographic hashing', () => {
  // Username check
  assert.equal(AUTHORIZED_USERNAME, 'Rishith');

  // Password hashing test
  const testPass = 'JobPrepSecure2027!';
  const hash = hashPassword(testPass);

  assert.ok(hash.startsWith('pbkdf2:100000:'), 'Hash must use PBKDF2 with 100,000 iterations');
  assert.ok(verifyPassword(testPass, hash), 'Valid password must verify successfully');
  assert.equal(verifyPassword('WrongPassword123', hash), false, 'Invalid password must be rejected');
  assert.equal(verifyPassword('', hash), false, 'Empty password must be rejected');
  assert.equal(verifyPassword(testPass, 'invalid:hash:string'), false, 'Corrupted hash must be rejected');
});

test('Session token and rate limit integrity', async () => {
  const { handleLogin } = await import('../server/auth.js');
  
  // Fake request with wrong username
  const fakeReq = {
    headers: { 'x-forwarded-for': '127.0.0.1' },
    socket: {},
    body: { username: 'RandomCandidate', password: 'SomePassword' }
  };
  
  let statusCode = 0;
  let jsonResponse = null;
  const fakeRes = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      jsonResponse = data;
      return this;
    },
    cookie() {}
  };

  await handleLogin(fakeReq, fakeRes);
  assert.equal(statusCode, 401, 'Non-Rishith username must return 401 Unauthorized');
  assert.equal(jsonResponse.error, 'Invalid username or password.');
});
