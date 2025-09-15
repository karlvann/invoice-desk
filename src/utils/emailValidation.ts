// Simple email validation for invoice app
// Keep it simple - we're selling mattresses, not launching rockets

export interface EmailValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
}

/**
 * Basic email validation
 * Just check if it looks like an email
 */
export function validateEmail(email: string): EmailValidationResult {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const trimmedEmail = email.trim().toLowerCase();
  
  // Basic email regex - not perfect but good enough
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(trimmedEmail)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true };
}

// For backwards compatibility
export const isValidEmail = (email: string): boolean => {
  return validateEmail(email).valid;
};

// Format email (just trim and lowercase)
export const formatEmail = (email: string): string => {
  return email ? email.trim().toLowerCase() : '';
};