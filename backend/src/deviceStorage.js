// Device Storage Module
// Manages visitor identification per device without authentication
// Stores device ID, visitor name, and tracks device information

const crypto = require('crypto');

/**
 * Generate a unique device ID fingerprint
 * Uses a combination of strategies to identify a device
 * Falls back to random ID if needed
 */
function generateDeviceId() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Create a device fingerprint from user agent and other headers
 * This helps identify the same device across sessions
 */
function createDeviceFingerprint(userAgent, acceptLanguage) {
  const combined = `${userAgent}|${acceptLanguage}`;
  return crypto.createHash('sha256').update(combined).digest('hex');
}

module.exports = {
  generateDeviceId,
  createDeviceFingerprint,
};
