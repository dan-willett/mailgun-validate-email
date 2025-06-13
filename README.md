# mailgun-validate-email-esm

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/)
[![github version](https://badge.fury.io/gh/dan-willett%2Fmailgun-validate-email.svg)](https://badge.fury.io/gh/dan-willett%2Fmailgun-validate-email)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modern, lightweight wrapper for the Mailgun v4 Inbox Ready API. This module helps you validate email addresses in real-time, check deliverability, and prevent fake or invalid email submissions.

## Features

- **Mailgun v4 Inbox Ready API** - Uses the latest validation endpoints
- **Provider Lookup** - Optional provider verification for accurate results
- **Flexible Integration** - Supports both Promise and callback patterns
- **Modern JavaScript** - Built with ES Modules and async/await
- **Comprehensive Error Handling** - Detailed error messages and status codes
- **TypeScript Support** - Includes TypeScript type definitions
- **Node.js 22+** - Optimized for modern Node.js versions

## Installation

```sh
npm install mailgun-validate-email
# or
yarn add mailgun-validate-email
```

## Usage

### ES Modules (Recommended)

```javascript
import createValidator from 'mailgun-validate-email';

// Create validator instance with your Mailgun public API key
const validate = createValidator('your-mailgun-public-key');

// Using async/await (recommended)
try {
  const result = await validate('test@example.com');
  console.log('Validation result:', result);
} catch (error) {
  console.error('Validation failed:', error);
}

// Or with Promise
validate('test@example.com')
  .then(result => console.log('Valid:', result.is_valid))
  .catch(error => console.error('Error:', error));

// Or with callback
validate('test@example.com', (error, result) => {
  if (error) {
    console.error('Validation error:', error);
    return;
  }
  console.log('Is valid?', result.is_valid);
});
```

### Response Format

The validation result includes the following fields:

```javascript
{
  "address": "test@example.com",
  "is_valid": true,  // Backward compatibility field
  "result": "deliverable",  // 'deliverable', 'undeliverable', 'do_not_send', 'catch_all', 'unknown'
  "risk": "low",  // 'high', 'medium', 'low', 'unknown'
  "is_disposable_address": false,
  "is_role_address": false,
  "reason": [],  // Array of reasons if validation failed
  "suggestion": null,  // Suggested correction if available
  "mailbox_verification": "true"  // If mailbox verification was performed
}
```

### Configuration Options

```javascript
import createValidator from 'mailgun-validate-email';

const validate = createValidator('your-api-key', {
  providerLookup: true,  // Enable/disable provider lookup (default: true)
  timeout: 10000        // Request timeout in milliseconds (default: 10000)
});
```

### Error Handling

The module throws/rejects with detailed error objects that include:
- `message`: Human-readable error message
- `code`: Error code:
  - `EAUTH`: Authentication failed (401)
  - `EAPI`: API error (4xx/5xx)
  - `ETIMEDOUT`: Request timed out
  - `EUNKNOWN`: Unknown error
- `status`: HTTP status code (for API errors)

Example error handling:

```javascript
try {
  await validate('test@example.com');
} catch (error) {
  if (error.code === 'EAUTH') {
    console.error('Authentication failed. Please check your API key.');
  } else if (error.code === 'ETIMEDOUT') {
    console.error('Request timed out. Please try again later.');
  } else {
    console.error('Validation failed:', error.message);
  }
}
```


## Why Use Mailgun's Email Validation?

While there are simpler ways to check if an email is formatted correctly (like using `Joi.string().email()`), Mailgun's validation goes much further:

- **MX Record Validation**: Verifies the domain has valid MX records
- **Disposable Email Detection**: Identifies temporary/throwaway email addresses
- **Role-based Email Detection**: Flags emails like `admin@` or `support@`
- **Mailbox Verification**: Checks if the mailbox can receive emails
- **Typo Detection**: Suggests corrections for common typos

### Example Validation Scenarios

```javascript
// Valid email with common typo
const result = await validate('john.doe@gmaill.com');
// result.did_you_mean might be 'john.doe@gmail.com'

// Disposable email address
const disposable = await validate('temp123@mailinator.com');
// disposable.is_disposable_address === true

// Non-existent domain
const invalid = await validate('user@nonexistentdomain12345.com');
// invalid.is_valid === false
// invalid.reason === 'no_mx_record'
```

### Important Notes

- This service requires a valid Mailgun account and API key
- Always implement proper error handling in your application
- Consider implementing rate limiting to prevent abuse
- For production use, you may want to implement caching of validation results
- Remember to handle timeouts and network issues gracefully

### Security Considerations

- Never expose your private Mailgun API key in client-side code
- Consider implementing server-side validation as an API endpoint
- Be aware of rate limits on the Mailgun API
- Always validate and sanitize all user input


## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License

Copyright (c) 2024 Dan Willett

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
