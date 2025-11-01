import { z } from 'zod';

// Common validation patterns
export const emailValidation = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(254, 'Email is too long'); // RFC 5321 limit

export const displayNameValidation = z
  .string()
  .min(1, 'Display name is required')
  .min(2, 'Display name must be at least 2 characters')
  .max(50, 'Display name must be less than 50 characters')
  .regex(/^[a-zA-Z0-9\s._-]+$/, 'Display name can only contain letters, numbers, spaces, dots, underscores, and hyphens');

// Password strength validation with detailed requirements
export const passwordValidation = z
  .string()
  .min(1, 'Password is required')
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

// Simple password validation for login (less strict)
export const loginPasswordValidation = z
  .string()
  .min(1, 'Password is required')
  .min(6, 'Password must be at least 6 characters');

// Login form schema
export const loginSchema = z.object({
  email: emailValidation,
  password: loginPasswordValidation,
});

// Signup form schema with password confirmation
export const signupSchema = z
  .object({
    displayName: displayNameValidation,
    email: emailValidation,
    password: passwordValidation,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Password reset schema
export const passwordResetSchema = z.object({
  email: emailValidation,
});

// Change password schema
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordValidation,
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New passwords don't match",
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ['newPassword'],
  });

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type PasswordResetFormData = z.infer<typeof passwordResetSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// Password strength checker utility
export interface PasswordStrengthCheck {
  test: RegExp;
  label: string;
  passed: boolean;
}

export interface PasswordStrength {
  score: number;
  checks: PasswordStrengthCheck[];
  label: 'Weak' | 'Medium' | 'Strong';
  color: string;
  percentage: number;
}

export const getPasswordStrength = (password: string): PasswordStrength => {
  const checks = [
    { test: /.{8,}/, label: 'At least 8 characters' },
    { test: /[a-z]/, label: 'One lowercase letter' },
    { test: /[A-Z]/, label: 'One uppercase letter' },
    { test: /[0-9]/, label: 'One number' },
    { test: /[^a-zA-Z0-9]/, label: 'One special character' },
  ];

  const passedChecks = checks.map(check => ({
    ...check,
    passed: check.test.test(password),
  }));

  const score = passedChecks.filter(check => check.passed).length;
  const percentage = (score / checks.length) * 100;

  let label: 'Weak' | 'Medium' | 'Strong';
  let color: string;

  if (score < 2) {
    label = 'Weak';
    color = 'text-red-500';
  } else if (score < 4) {
    label = 'Medium';
    color = 'text-yellow-500';
  } else {
    label = 'Strong';
    color = 'text-green-500';
  }

  return {
    score,
    checks: passedChecks,
    label,
    color,
    percentage,
  };
};

// Form error handling utilities
export interface FormError {
  field?: string;
  message: string;
  code?: string;
}

export const parseAuthError = (error: any): FormError => {
  // Handle different types of errors from the API
  if (error?.response?.data?.message) {
    const message = error.response.data.message;
    
    // Map common API error messages to user-friendly messages
    const errorMappings: Record<string, string> = {
      'Invalid credentials': 'Invalid email or password. Please try again.',
      'User already exists': 'An account with this email already exists.',
      'User not found': 'No account found with this email address.',
      'Invalid email': 'Please enter a valid email address.',
      'Password too weak': 'Password does not meet security requirements.',
      'Email already in use': 'This email is already registered. Try signing in instead.',
      'Invalid token': 'Your session has expired. Please sign in again.',
      'Account locked': 'Your account has been temporarily locked. Please try again later.',
    };

    return {
      message: errorMappings[message] || message,
      code: error.response.data.code,
    };
  }

  // Handle network errors
  if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error')) {
    return {
      message: 'Unable to connect to the server. Please check your internet connection and try again.',
      code: 'NETWORK_ERROR',
    };
  }

  // Handle timeout errors
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return {
      message: 'Request timed out. Please try again.',
      code: 'TIMEOUT',
    };
  }

  // Default error message
  return {
    message: 'An unexpected error occurred. Please try again.',
    code: 'UNKNOWN_ERROR',
  };
};

// Validation helpers
export const validateEmail = (email: string): boolean => {
  try {
    emailValidation.parse(email);
    return true;
  } catch {
    return false;
  }
};

export const validatePassword = (password: string): boolean => {
  try {
    passwordValidation.parse(password);
    return true;
  } catch {
    return false;
  }
};

export const validateDisplayName = (displayName: string): boolean => {
  try {
    displayNameValidation.parse(displayName);
    return true;
  } catch {
    return false;
  }
};

// Debounced validation for real-time feedback
export const createDebouncedValidator = <T>(
  validator: (value: T) => boolean,
  delay: number = 300
) => {
  let timeoutId: NodeJS.Timeout;
  
  return (value: T, callback: (isValid: boolean) => void) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      callback(validator(value));
    }, delay);
  };
};