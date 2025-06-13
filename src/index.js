import fetch from 'node-fetch';
import { Buffer } from 'node:buffer';

const API_BASE_URL = 'https://api.mailgun.net/v3/address/validate';
const TIMEOUT_MS = 4000;

/**
 * Creates a validator function for email addresses using Mailgun's API
 * @param {string} apiKey - The Mailgun API key
 * @returns {Function} A function that validates email addresses
 */
export default function createValidator(apiKey) {
  const authHeader = `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`;

  /**
   * Validates an email address using Mailgun's API
   * @param {string} email - The email address to validate
   * @param {Function} [callback] - Optional callback function
   * @returns {Promise<Object>|void} Returns a promise if no callback is provided
   */
  return function validator(email, callback) {
    // If no callback is provided, return a Promise
    if (typeof callback !== 'function') {
      return validateEmail(email);
    }

    // Support callback style
    validateEmail(email)
      .then(result => callback(null, result))
      .catch(callback);
  };

  async function validateEmail(email) {
    const url = new URL(API_BASE_URL);
    url.searchParams.append('address', email);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If we can't parse the error response, use the default message
        }
        
        const error = new Error(errorMessage);
        error.status = response.status;
        error.code = response.status === 401 ? 'EAUTH' : 'EAPI';
        throw error;
      }

      const result = await response.json();
      
      // Add backward compatibility with v2/v3 API fields
      result.is_valid = result.result === 'deliverable';
      
      return result;
    } catch (error) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        const timeoutError = new Error('Request timed out');
        timeoutError.code = 'ETIMEDOUT';
        throw timeoutError;
      }
      // Add error code if not present
      if (!error.code) {
        error.code = 'EUNKNOWN';
      }
      throw error;
    }
  }
}
