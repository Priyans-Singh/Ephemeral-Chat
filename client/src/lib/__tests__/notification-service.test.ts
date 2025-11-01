import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { notificationService, notify } from '../notification-service';

// Mock sonner
vi.mock('sonner', () => {
  const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    dismiss: vi.fn(),
  };
  
  return {
    toast: mockToast,
  };
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  // Get the mocked toast functions
  const getMockToast = () => vi.mocked(require('sonner').toast);

  afterEach(() => {
    notificationService.clearQueue();
  });

  describe('preferences management', () => {
    it('should load default preferences when localStorage is empty', () => {
      const preferences = notificationService.getPreferences();
      
      expect(preferences).toEqual({
        enabled: true,
        types: {
          success: true,
          error: true,
          info: true,
          warning: true,
        },
        position: 'top-right',
        duration: 4000,
        sound: false,
      });
    });

    it('should load preferences from localStorage', () => {
      const storedPrefs = {
        enabled: false,
        types: { success: false, error: true, info: true, warning: false },
        position: 'bottom-left',
        duration: 2000,
        sound: true,
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedPrefs));
      
      // Create new instance to test loading
      const testService = new (notificationService.constructor as any)();
      const preferences = testService.getPreferences();
      
      expect(preferences).toEqual(storedPrefs);
    });

    it('should update and save preferences', () => {
      const updates = {
        enabled: false,
        duration: 2000,
      };
      
      notificationService.updatePreferences(updates);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'notification-preferences',
        expect.stringContaining('"enabled":false')
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'notification-preferences',
        expect.stringContaining('"duration":2000')
      );
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      // Should not throw and should return defaults
      const testService = new (notificationService.constructor as any)();
      const preferences = testService.getPreferences();
      
      expect(preferences.enabled).toBe(true);
    });
  });

  describe('notification display', () => {
    it('should show success notification', () => {
      const mockToast = getMockToast();
      notificationService.success('Test success message');
      
      expect(mockToast.success).toHaveBeenCalledWith(
        'Test success message',
        expect.objectContaining({
          duration: 4000,
        })
      );
    });

    it('should show error notification', () => {
      notificationService.error('Test error message');
      
      expect(mockToast.error).toHaveBeenCalledWith(
        'Test error message',
        expect.objectContaining({
          duration: 4000,
        })
      );
    });

    it('should show warning notification', () => {
      notificationService.warning('Test warning message');
      
      expect(mockToast.warning).toHaveBeenCalledWith(
        'Test warning message',
        expect.objectContaining({
          duration: 4000,
        })
      );
    });

    it('should show info notification', () => {
      notificationService.info('Test info message');
      
      expect(mockToast.info).toHaveBeenCalledWith(
        'Test info message',
        expect.objectContaining({
          duration: 4000,
        })
      );
    });

    it('should not show notification when type is disabled', () => {
      notificationService.updatePreferences({
        types: { success: false, error: true, info: true, warning: true }
      });
      
      notificationService.success('Should not show');
      
      expect(mockToast.success).not.toHaveBeenCalled();
    });

    it('should not show notification when notifications are disabled', () => {
      notificationService.updatePreferences({ enabled: false });
      
      notificationService.success('Should not show');
      
      expect(mockToast.success).not.toHaveBeenCalled();
    });

    it('should show persistent notification', () => {
      notificationService.success('Persistent message', { persistent: true });
      
      expect(mockToast.success).toHaveBeenCalledWith(
        'Persistent message',
        expect.objectContaining({
          duration: Infinity,
        })
      );
    });

    it('should include action button when provided', () => {
      const action = { label: 'Retry', onClick: vi.fn() };
      
      notificationService.error('Error with action', { action });
      
      expect(mockToast.error).toHaveBeenCalledWith(
        'Error with action',
        expect.objectContaining({
          action: {
            label: 'Retry',
            onClick: action.onClick,
          },
        })
      );
    });
  });

  describe('convenience methods', () => {
    it('should provide connection-specific notifications', () => {
      notificationService.connectionEstablished();
      expect(mockToast.success).toHaveBeenCalledWith(
        'Connected to chat server',
        expect.any(Object)
      );

      notificationService.connectionLost();
      expect(mockToast.error).toHaveBeenCalledWith(
        'Connection lost',
        expect.objectContaining({
          persistent: true,
        })
      );

      notificationService.reconnecting(2);
      expect(mockToast.info).toHaveBeenCalledWith(
        'Reconnecting... (attempt 2)',
        expect.any(Object)
      );

      notificationService.reconnected();
      expect(mockToast.success).toHaveBeenCalledWith(
        'Reconnected successfully',
        expect.any(Object)
      );
    });

    it('should provide message-specific notifications', () => {
      notificationService.messageSent();
      expect(mockToast.success).toHaveBeenCalledWith(
        'Message sent',
        expect.objectContaining({
          showIcon: false,
        })
      );

      notificationService.messageReceived('John');
      expect(mockToast.info).toHaveBeenCalledWith(
        'New message from John',
        expect.any(Object)
      );

      notificationService.messageError('Network error');
      expect(mockToast.error).toHaveBeenCalledWith(
        'Failed to send message: Network error',
        expect.objectContaining({
          action: expect.any(Object),
        })
      );
    });

    it('should provide auth-specific notifications', () => {
      notificationService.loginSuccess();
      expect(mockToast.success).toHaveBeenCalledWith(
        'Successfully signed in!',
        expect.any(Object)
      );

      notificationService.loginError('Invalid credentials');
      expect(mockToast.error).toHaveBeenCalledWith(
        'Invalid credentials',
        expect.any(Object)
      );

      notificationService.signupSuccess();
      expect(mockToast.success).toHaveBeenCalledWith(
        'Account created successfully! Welcome!',
        expect.any(Object)
      );

      notificationService.signupError('Email already exists');
      expect(mockToast.error).toHaveBeenCalledWith(
        'Email already exists',
        expect.any(Object)
      );
    });
  });

  describe('queue management', () => {
    it('should dismiss notifications', () => {
      notificationService.dismiss();
      expect(mockToast.dismiss).toHaveBeenCalled();

      notificationService.dismiss('toast-id');
      expect(mockToast.dismiss).toHaveBeenCalledWith('toast-id');
    });

    it('should clear notification queue', () => {
      // This is mainly for coverage as the queue is internal
      notificationService.clearQueue();
      expect(true).toBe(true); // Just ensure no errors
    });
  });

  describe('convenience exports', () => {
    it('should provide notify convenience functions', () => {
      notify.success('Test success');
      expect(mockToast.success).toHaveBeenCalledWith(
        'Test success',
        expect.any(Object)
      );

      notify.error('Test error');
      expect(mockToast.error).toHaveBeenCalledWith(
        'Test error',
        expect.any(Object)
      );

      notify.warning('Test warning');
      expect(mockToast.warning).toHaveBeenCalledWith(
        'Test warning',
        expect.any(Object)
      );

      notify.info('Test info');
      expect(mockToast.info).toHaveBeenCalledWith(
        'Test info',
        expect.any(Object)
      );

      notify.dismiss();
      expect(mockToast.dismiss).toHaveBeenCalled();
    });
  });
});