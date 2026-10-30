/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Normalizes phone numbers with country code.
 * e.g. Country "+234", Phone "0803 123 4567" -> "+2348031234567"
 * If the user enters a full E.164 number like "+2348031234567", it is preserved.
 */
export function normalizePhoneNumber(countryCode: string, rawPhone: string): string {
  const cleanCode = countryCode.trim().startsWith('+') ? countryCode.trim() : `+${countryCode.trim()}`;
  let cleanPhone = rawPhone.replace(/[\s\-\(\)]/g, '').trim();

  // If already starts with '+', keep as normalized E.164
  if (cleanPhone.startsWith('+')) {
    return cleanPhone;
  }

  // If phone starts with leading zero (common in Nigeria e.g. 080..., 070...), strip it
  if (cleanPhone.startsWith('0')) {
    cleanPhone = cleanPhone.slice(1);
  }

  return `${cleanCode}${cleanPhone}`;
}

/**
 * Computes SHA-256 hash of a string (returned as hex).
 * Useful for indexing phone numbers uniquely without storing raw phone in public keys.
 */
export async function sha256Hex(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Converts ArrayBuffer / Uint8Array to hex string.
 */
function toHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Converts hex string to Uint8Array.
 */
function fromHex(hex: string): Uint8Array {
  const cleanHex = hex.trim();
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Generates a PBKDF2 hash of a password using Web Crypto API.
 * 100,000 rounds of PBKDF2-SHA256 with a unique 16-byte random salt.
 */
export async function hashPassword(
  password: string,
  providedSaltHex?: string
): Promise<{ hash: string; salt: string }> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  let saltBytes: Uint8Array;
  if (providedSaltHex) {
    saltBytes = fromHex(providedSaltHex);
  } else {
    saltBytes = new Uint8Array(16);
    crypto.getRandomValues(saltBytes as any);
  }

  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes as any,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    256 // 32 bytes
  );

  return {
    hash: toHex(derivedBits),
    salt: toHex(saltBytes),
  };
}

/**
 * Verifies a candidate password against stored PBKDF2 hash & salt in constant time.
 */
export async function verifyPassword(
  candidate: string,
  storedHashHex: string,
  storedSaltHex: string
): Promise<boolean> {
  try {
    const { hash: computedHashHex } = await hashPassword(candidate, storedSaltHex);
    if (computedHashHex.length !== storedHashHex.length) {
      return false;
    }
    // Constant time comparison to prevent timing attacks
    let diff = 0;
    for (let i = 0; i < computedHashHex.length; i++) {
      diff |= computedHashHex.charCodeAt(i) ^ storedHashHex.charCodeAt(i);
    }
    return diff === 0;
  } catch (err) {
    console.error('Password verification error:', err);
    return false;
  }
}

/**
 * Generates a secure 6-digit numeric OTP for phone verification/reset.
 */
export function generateSecureOtp(): string {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  const code = (buffer[0] % 900000) + 100000;
  return code.toString();
}

/**
 * Validates password complexity.
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number; // 0 to 4
  errors: string[];
} {
  const errors: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else errors.push('Password must be at least 8 characters long');

  if (/[A-Z]/.test(password)) score++;
  else errors.push('Include at least one uppercase letter (A-Z)');

  if (/[a-z]/.test(password)) score++;
  else errors.push('Include at least one lowercase letter (a-z)');

  if (/[0-9]/.test(password)) score++;
  else errors.push('Include at least one number (0-9)');

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score = Math.min(score + 1, 4);
  }

  return {
    isValid: errors.length === 0,
    score: Math.min(score, 4),
    errors,
  };
}
