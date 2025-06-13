import { test, mock, describe } from 'node:test';
import assert from 'node:assert/strict';
import createValidator from '../src/index.js';

// There is no public API key for Mailgun, so you need to set it in the environment variable
const API_KEY = process.env.MAILGUN_API_KEY || '';

// Skip live API tests if we don't have a valid API key
const SKIP_LIVE_TESTS = !process.env.MAILGUN_API_KEY;
const testLive = SKIP_LIVE_TESTS ? test.skip : test;

// Helper function to validate common response structure
function validateMailgunResponse(result) {
  assert.strictEqual(typeof result, 'object');
  assert('is_valid' in result, 'Response should have is_valid property');
  assert('result' in result, 'Response should have result property');
  assert('risk' in result, 'Response should have risk property');
  assert(Array.isArray(result.reason), 'reason should be an array');
}

describe('Mailgun Email Validation', () => {
  const validate = createValidator(API_KEY);

  testLive('valid email with callback', (t, done) => {
    validate('banana@papaia.com', (err, result) => {
      if (err) return done(err);
      try {
        validateMailgunResponse(result);
        assert.strictEqual(result.is_valid, true);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  testLive('valid email with promise', async () => {
    const result = await validate('banana@papaia.com');
    validateMailgunResponse(result);
    assert.strictEqual(result.is_valid, true);
  });

  testLive('invalid email format', (t, done) => {
    validate('invalid-email-format', (err, result) => {
      if (err) return done(err);
      try {
        validateMailgunResponse(result);
        assert.strictEqual(result.is_valid, false);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  test('timeout error handling', async () => {
    const fastValidate = createValidator(API_KEY, { 
      timeout: 1,
      providerLookup: true 
    });
    
    try {
      await fastValidate('test@example.com');
      assert.fail('Should have timed out');
    } catch (err) {
      assert.strictEqual(err.code, 'ETIMEDOUT');
    }
  });

  test('invalid API key', async () => {
    const invalidValidator = createValidator('invalid-api-key');
    try {
      await invalidValidator('test@example.com');
      assert.fail('Should have failed with invalid API key');
    } catch (err) {
      assert(err.status === 401 || err.status === 403, 'Should return 401 or 403 for invalid API key');
      assert.strictEqual(err.code, 'EAUTH');
    }
  });

  test('server error handling', async () => {
    const mockFetch = mock.method(global, 'fetch');
    mockFetch.mock.mockImplementation(() => ({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({
        message: 'Internal server error'
      })
    }));

    try {
      await validate('test@example.com');
      assert.fail('Should have thrown an error');
    } catch (err) {
      assert.strictEqual(err.status, 500);
      assert.strictEqual(err.code, 'EAPI');
      assert.strictEqual(err.message, 'Internal server error');
    } finally {
      mockFetch.mock.restore();
    }
  });

  test('network error handling', async () => {
    const mockFetch = mock.method(global, 'fetch');
    mockFetch.mock.mockImplementation(() => {
      throw new Error('Network error');
    });

    try {
      await validate('test@example.com');
      assert.fail('Should have thrown a network error');
    } catch (err) {
      assert.strictEqual(err.message, 'Network error');
      assert.strictEqual(err.code, 'EUNKNOWN');
    } finally {
      mockFetch.mock.restore();
    }
  });
});

// Skip live API tests if no API key is provided
if (SKIP_LIVE_TESTS) {
  console.warn('\n⚠️  WARNING: Running without a valid Mailgun API key. Live API tests will be skipped.');
  console.warn('   Set MAILGUN_API_KEY environment variable to run live tests.\n');
}
