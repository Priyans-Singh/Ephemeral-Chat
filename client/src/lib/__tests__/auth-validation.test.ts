import { describe, it, expect } from 'vitest';
import {
  emailValidation,
  displayNameValidation,
  passwordValidation,
  loginPasswordValidation,
  loginSchema,
  signupSchema,
  getPasswordStrength,
  parseAuthError,
  validateEmail,
  validatePassword,
  validateDisplayName,
} from '../auth-validation';

describe('auth-validation', () => {
  describe('emailValidation', () => {
    it('validates correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
      ];

      validEmails.forEach(email => {
        expect(() => emailValidation.parse(email)).not.toThrow();
      });
    });

    it('rejects invalid email addresses', () => {
      const invalidEmails = [
        '',
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        'user..name@example.com',
        'a'.repeat(255) + '@example.com', // Too long
      ];

      invalidEmails.forEach(email => {
        expect(() => emailValidation.parse(email)).toThrow();
      });
    });
  });

  describe('displayNameValidation', () => {
    it('validates correct display names', () => {
      const validNames = [
        'John Doe',
        'user123',
        'test_user',
        'user-name',
        'User.Name',
        'AB', // Minimum length
      ];

      validNames.forEach(name => {
        expect(() => displayNameValidation.parse(name)).not.toThrow();
      });
    });

    it('rejects invalid display names', () => {
      const invalidNames = [
        '',
        'a', // Too short
        'a'.repeat(51), // Too long
        'user@name', // Invalid character
        'user#name', // Invalid character
        'user%name', // Invalid character
      ];

      invalidNames.forEach(name => {
        expect(() => displayNameValidation.parse(name)).toThrow();
      });
    });
  });

  describe('passwordValidation', () => {
    it('validates strong passwords', () => {
      const validPasswords = [
        'StrongPass123!',
        'MyP@ssw0rd',
        'Secure123#',
        'Complex1$',
      ];

      validPasswords.forEach(password => {
        expect(() => passwordValidation.parse(password)).not.toThrow();
      });
    });

    it('rejects weak passwords', () => {
      const invalidPasswords = [
        '',
        'short', // Too short
        'nouppercase123!', // No uppercase
        'NOLOWERCASE123!', // No lowercase
        'NoNumbers!', // No numbers
        'NoSpecialChars123', // No special characters
        'a'.repeat(129), // Too long
      ];

      invalidPasswords.forEach(password => {
        expect(() => passwordValidation.parse(password)).toThrow();
      });
    });
  });

  describe('loginPasswordValidation', () => {
    it('validates passwords with minimum requirements for login', () => {
      const validPasswords = [
        'simple123',
        'password',
        'test123',
      ];

      validPasswords.forEach(password => {
        expect(() => loginPasswordValidation.parse(password)).not.toThrow();
      });
    });

    it('rejects passwords that are too short', () => {
      const invalidPasswords = [
        '',
        'short',
        '12345',
      ];

      invalidPasswords.forEach(password => {
        expect(() => loginPasswordValidation.parse(password)).toThrow();
      });
    });
  });

  describe('loginSchema', () => {
    it('validates correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };

      expect(() => loginSchema.parse(validData)).not.toThrow();
    });

    it('rejects invalid login data', () => {
      const invalidData = [
        { email: 'invalid-email', password: 'password123' },
        { email: 'test@example.com', password: 'short' },
        { email: '', password: '' },
      ];

      invalidData.forEach(data => {
        expect(() => loginSchema.parse(data)).toThrow();
      });
    });
  });

  describe('signupSchema', () => {
    it('validates correct signup data', () => {
      const validData = {
        displayName: 'John Doe',
        email: 'test@example.com',
        password: 'StrongPass123!',
        confirmPassword: 'StrongPass123!',
      };

      expect(() => signupSchema.parse(validData)).not.toThrow();
    });

    it('rejects mismatched passwords', () => {
      const invalidData = {
        displayName: 'John Doe',
        email: 'test@example.com',
        password: 'StrongPass123!',
        confirmPassword: 'DifferentPass123!',
      };

      expect(() => signupSchema.parse(invalidData)).toThrow();
    });

    it('rejects invalid field data', () => {
      const invalidData = [
        {
          displayName: 'a', // Too short
          email: 'test@example.com',
          password: 'StrongPass123!',
          confirmPassword: 'StrongPass123!',
        },
        {
          displayName: 'John Doe',
          email: 'invalid-email',
          password: 'StrongPass123!',
          confirmPassword: 'StrongPass123!',
        },
        {
          displayName: 'John Doe',
          email: 'test@example.com',
          password: 'weak',
          confirmPassword: 'weak',
        },
      ];

      invalidData.forEach(data => {
        expect(() => signupSchema.parse(data)).toThrow();
      });
    });
  });

  describe('getPasswordStrength', () => {
    it('returns weak strength for simple passwords', () => {
      const weakPasswords = ['pass', '123', 'abc'];
      
      weakPasswords.forEach(password => {
        const strength = getPasswordStrength(password);
        expect(strength.label).toBe('Weak');
        expect(strength.score).toBeLessThan(2);
        expect(strength.color).toBe('text-red-500');
      });
    });

    it('returns medium strength for moderately complex passwords', () => {
      const mediumPasswords = ['password1', 'Password'];
      
      mediumPasswords.forEach(password => {
        const strength = getPasswordStrength(password);
        expect(strength.label).toBe('Medium');
        expect(strength.score).toBeGreaterThanOrEqual(2);
        expect(strength.score).toBeLessThan(4);
        expect(strength.color).toBe('text-yellow-500');
      });
    });

    it('returns strong strength for complex passwords', () => {
      const strongPasswords = ['StrongPass123!', 'MyP@ssw0rd', 'Secure123#'];
      
      strongPasswords.forEach(password => {
        const strength = getPasswordStrength(password);
        expect(strength.label).toBe('Strong');
        expect(strength.score).toBe(5);
        expect(strength.color).toBe('text-green-500');
      });
    });

    it('provides detailed check results', () => {
      const password = 'StrongPass123!';
      const strength = getPasswordStrength(password);
      
      expect(strength.checks).toHaveLength(5);
      expect(strength.checks.every(check => check.passed)).toBe(true);
      expect(strength.percentage).toBe(100);
    });
  });

  describe('parseAuthError', () => {
    it('parses API error responses', () => {
      const apiError = {
        response: {
          data: {
            message: 'Invalid credentials',
            code: 'INVALID_CREDENTIALS',
          },
        },
      };

      const parsed = parseAuthError(apiError);
      expect(parsed.message).toBe('Invalid email or password. Please try again.');
      expect(parsed.code).toBe('INVALID_CREDENTIALS');
    });

    it('handles network errors', () => {
      const networkError = {
        code: 'NETWORK_ERROR',
        message: 'Network Error',
      };

      const parsed = parseAuthError(networkError);
      expect(parsed.message).toContain('Unable to connect to the server');
      expect(parsed.code).toBe('NETWORK_ERROR');
    });

    it('handles timeout errors', () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded',
      };

      const parsed = parseAuthError(timeoutError);
      expect(parsed.message).toContain('Request timed out');
      expect(parsed.code).toBe('TIMEOUT');
    });

    it('provides default error for unknown errors', () => {
      const unknownError = new Error('Something went wrong');

      const parsed = parseAuthError(unknownError);
      expect(parsed.message).toBe('An unexpected error occurred. Please try again.');
      expect(parsed.code).toBe('UNKNOWN_ERROR');
    });

    it('maps common error messages to user-friendly messages', () => {
      const commonErrors = [
        { message: 'User already exists', expected: 'An account with this email already exists.' },
        { message: 'User not found', expected: 'No account found with this email address.' },
        { message: 'Invalid email', expected: 'Please enter a valid email address.' },
        { message: 'Email already in use', expected: 'This email is already registered. Try signing in instead.' },
      ];

      commonErrors.forEach(({ message, expected }) => {
        const error = {
          response: {
            data: { message },
          },
        };

        const parsed = parseAuthError(error);
        expect(parsed.message).toBe(expected);
      });
    });
  });

  describe('validation helper functions', () => {
    describe('validateEmail', () => {
      it('returns true for valid emails', () => {
        expect(validateEmail('test@example.com')).toBe(true);
        expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      });

      it('returns false for invalid emails', () => {
        expect(validateEmail('invalid-email')).toBe(false);
        expect(validateEmail('')).toBe(false);
        expect(validateEmail('@example.com')).toBe(false);
      });
    });

    describe('validatePassword', () => {
      it('returns true for strong passwords', () => {
        expect(validatePassword('StrongPass123!')).toBe(true);
        expect(validatePassword('MyP@ssw0rd')).toBe(true);
      });

      it('returns false for weak passwords', () => {
        expect(validatePassword('weak')).toBe(false);
        expect(validatePassword('nouppercase123!')).toBe(false);
        expect(validatePassword('NoNumbers!')).toBe(false);
      });
    });

    describe('validateDisplayName', () => {
      it('returns true for valid display names', () => {
        expect(validateDisplayName('John Doe')).toBe(true);
        expect(validateDisplayName('user123')).toBe(true);
        expect(validateDisplayName('test_user')).toBe(true);
      });

      it('returns false for invalid display names', () => {
        expect(validateDisplayName('a')).toBe(false);
        expect(validateDisplayName('')).toBe(false);
        expect(validateDisplayName('user@name')).toBe(false);
      });
    });
  });
});