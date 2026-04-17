/**
 * Lightweight validation utilities. Zero runtime deps.
 * For complex schemas use Zod/Valibot; for form field validation prefer this.
 */

export type ValidationResult = { valid: true } | { valid: false; error: string };

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(value: string): ValidationResult {
  const trimmed = value.trim();
  if (!trimmed) return { valid: false, error: 'Email is required' };
  if (trimmed.length > 254) return { valid: false, error: 'Email is too long' };
  if (!EMAIL_REGEX.test(trimmed)) return { valid: false, error: 'Enter a valid email address' };
  return { valid: true };
}

export function validatePassword(value: string, minLength = 8): ValidationResult {
  if (!value) return { valid: false, error: 'Password is required' };
  if (value.length < minLength) return { valid: false, error: `Password must be at least ${minLength} characters` };
  if (!/[A-Z]/.test(value)) return { valid: false, error: 'Password must contain an uppercase letter' };
  if (!/[a-z]/.test(value)) return { valid: false, error: 'Password must contain a lowercase letter' };
  if (!/[0-9]/.test(value)) return { valid: false, error: 'Password must contain a number' };
  return { valid: true };
}

export function validateRequired(value: string, fieldName = 'Field'): ValidationResult {
  if (!value || !value.trim()) return { valid: false, error: `${fieldName} is required` };
  return { valid: true };
}

export function validateMinLength(value: string, min: number, fieldName = 'Field'): ValidationResult {
  if (value.trim().length < min) return { valid: false, error: `${fieldName} must be at least ${min} characters` };
  return { valid: true };
}

export function validateMaxLength(value: string, max: number, fieldName = 'Field'): ValidationResult {
  if (value.length > max) return { valid: false, error: `${fieldName} must be at most ${max} characters` };
  return { valid: true };
}

export function validateUrl(value: string): ValidationResult {
  if (!value) return { valid: false, error: 'URL is required' };
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { valid: false, error: 'URL must use http or https' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Enter a valid URL' };
  }
}

export function validateMatch(a: string, b: string, fieldName = 'Fields'): ValidationResult {
  if (a !== b) return { valid: false, error: `${fieldName} do not match` };
  return { valid: true };
}

export function validatePhone(value: string): ValidationResult {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) {
    return { valid: false, error: 'Enter a valid phone number' };
  }
  return { valid: true };
}

/**
 * Run a list of validators and return the first failure.
 */
export function composeValidators(...validators: Array<() => ValidationResult>): ValidationResult {
  for (const run of validators) {
    const result = run();
    if (!result.valid) return result;
  }
  return { valid: true };
}
