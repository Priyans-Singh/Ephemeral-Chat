import React from 'react';
import { toast } from 'sonner';
import type { ExternalToast } from 'sonner';
import { CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface NotificationOptions {
  type?: NotificationType;
  persistent?: boolean;
  showIcon?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  cancel?: {
    label: string;
    onClick?: () => void;
  };
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

export interface NotificationPrefs {
  enabled: boolean;
  types: {
    success: boolean;
    error: boolean;
    info: boolean;
    warning: boolean;
  };
  position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  duration: number;
  sound: boolean;
}

class NotificationService {
  private preferences: NotificationPrefs;
  private queue: Array<{ message: string; options: NotificationOptions }> = [];
  private isProcessingQueue = false;
  // Dedup connection toasts across rapid mount/unmount and reconnects
  private lastConnectionEstablishedAt = 0;
  private lastConnectionLostAt = 0;

  constructor() {
    this.preferences = this.loadPreferences();
  }

  private loadPreferences(): NotificationPrefs {
    const stored = localStorage.getItem('notification-preferences');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Fall back to defaults if parsing fails
      }
    }
    
    return {
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
    };
  }

  private savePreferences() {
    localStorage.setItem('notification-preferences', JSON.stringify(this.preferences));
  }

  public getPreferences(): NotificationPrefs {
    return { ...this.preferences };
  }

  public updatePreferences(updates: Partial<NotificationPrefs>) {
    this.preferences = { ...this.preferences, ...updates };
    this.savePreferences();
  }

  private shouldShowNotification(type: NotificationType): boolean {
    return this.preferences.enabled && this.preferences.types[type];
  }

  private getIcon(type: NotificationType) {
    switch (type) {
      case 'success':
        return CheckCircle;
      case 'error':
        return AlertCircle;
      case 'warning':
        return AlertTriangle;
      case 'info':
        return Info;
      default:
        return Info;
    }
  }

  private async processQueue() {
    if (this.isProcessingQueue || this.queue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    while (this.queue.length > 0) {
      const { message, options } = this.queue.shift()!;
      await this.showNotificationInternal(message, options);
      
      // Small delay between notifications to prevent overwhelming
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    this.isProcessingQueue = false;
  }

  private async showNotificationInternal(message: string, options: NotificationOptions = {}) {
    const { type = 'info', persistent = false, showIcon = true, action, cancel, ...toastOptions } = options;
    
    if (!this.shouldShowNotification(type)) return;

    const IconComp = showIcon ? this.getIcon(type) : undefined;
    
    const baseOptions: ExternalToast = {
      duration: persistent ? Infinity : this.preferences.duration,
      ...toastOptions,
    };

    if (action) {
      baseOptions.action = {
        label: action.label,
        onClick: action.onClick,
      };
    }

    if (cancel) {
      baseOptions.cancel = {
        label: cancel.label,
        onClick: () => cancel.onClick?.() ?? void 0,
      };
    }

    // Add icon element if provided (Sonner expects a ReactNode, not a component type)
    if (IconComp && showIcon) {
      baseOptions.icon = React.createElement(IconComp, { className: 'size-4' });
    }

    switch (type) {
      case 'success':
        return toast.success(message, baseOptions);
      case 'error':
        return toast.error(message, baseOptions);
      case 'warning':
        return toast.warning(message, baseOptions);
      case 'info':
      default:
        return toast.info(message, baseOptions);
    }
  }

  public success(message: string, options: Omit<NotificationOptions, 'type'> = {}) {
    return this.show(message, { ...options, type: 'success' });
  }

  public error(message: string, options: Omit<NotificationOptions, 'type'> = {}) {
    return this.show(message, { ...options, type: 'error' });
  }

  public warning(message: string, options: Omit<NotificationOptions, 'type'> = {}) {
    return this.show(message, { ...options, type: 'warning' });
  }

  public info(message: string, options: Omit<NotificationOptions, 'type'> = {}) {
    return this.show(message, { ...options, type: 'info' });
  }

  public show(message: string, options: NotificationOptions = {}) {
    if (options.persistent || this.queue.length < 5) {
      // Show immediately for persistent notifications or if queue is small
      return this.showNotificationInternal(message, options);
    } else {
      // Queue the notification if we have too many
      this.queue.push({ message, options });
      this.processQueue();
    }
  }

  public dismiss(toastId?: string | number) {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  }

  public clearQueue() {
    this.queue = [];
  }

  // Connection-specific notifications
  public connectionEstablished() {
    const now = Date.now();
    // Suppress duplicates within 1.5s (e.g., StrictMode double-connect)
    if (now - this.lastConnectionEstablishedAt < 1500) return;
    this.lastConnectionEstablishedAt = now;
    // If a persistent "lost" toast was just shown, clear it to reduce noise
    if (now - this.lastConnectionLostAt < 1500) {
      this.dismiss();
    }
    this.success('Connected to chat server', {
      showIcon: true,
      duration: 2000,
    });
  }

  public connectionLost() {
    const now = Date.now();
    // If we just connected very recently, this is likely a stale socket being closed → suppress
    if (now - this.lastConnectionEstablishedAt < 1000) return;
    this.lastConnectionLostAt = now;
    this.error('Connection lost', {
      showIcon: true,
      persistent: true,
      action: {
        label: 'Retry',
        onClick: () => window.location.reload(),
      },
    });
  }

  public reconnecting(attempt?: number) {
    const message = attempt ? `Reconnecting... (attempt ${attempt})` : 'Reconnecting...';
    this.info(message, {
      showIcon: true,
      duration: 1000,
    });
  }

  public reconnected() {
    this.success('Reconnected successfully', {
      showIcon: true,
      duration: 2000,
    });
  }

  // Message-specific notifications
  public messageSent() {
    this.success('Message sent', {
      showIcon: false,
      duration: 1000,
    });
  }

  public messageReceived(from: string) {
    this.info(`New message from ${from}`, {
      showIcon: true,
      duration: 3000,
    });
  }

  public messageError(error: string) {
    this.error(`Failed to send message: ${error}`, {
      showIcon: true,
      action: {
        label: 'Retry',
        onClick: () => {
          // This would be handled by the calling component
        },
      },
    });
  }

  // Authentication notifications
  public loginSuccess() {
    this.success('Successfully signed in!', {
      showIcon: true,
      duration: 2000,
    });
  }

  public loginError(error: string) {
    this.error(error, {
      showIcon: true,
      duration: 5000,
    });
  }

  public signupSuccess() {
    this.success('Account created successfully! Welcome!', {
      showIcon: true,
      duration: 3000,
    });
  }

  public signupError(error: string) {
    this.error(error, {
      showIcon: true,
      duration: 5000,
    });
  }

  // File upload notifications
  public fileUploadStart(filename: string) {
    this.info(`Uploading ${filename}...`, {
      showIcon: true,
      persistent: true,
    });
  }

  public fileUploadSuccess(filename: string) {
    this.success(`${filename} uploaded successfully`, {
      showIcon: true,
      duration: 2000,
    });
  }

  public fileUploadError(filename: string, error: string) {
    this.error(`Failed to upload ${filename}: ${error}`, {
      showIcon: true,
      duration: 5000,
      action: {
        label: 'Retry',
        onClick: () => {
          // This would be handled by the calling component
        },
      },
    });
  }
}

// Create a singleton instance
export const notificationService = new NotificationService();

// Export convenience functions that use the service
export const notify = {
  success: (message: string, options?: Omit<NotificationOptions, 'type'>) => 
    notificationService.success(message, options),
  error: (message: string, options?: Omit<NotificationOptions, 'type'>) => 
    notificationService.error(message, options),
  warning: (message: string, options?: Omit<NotificationOptions, 'type'>) => 
    notificationService.warning(message, options),
  info: (message: string, options?: Omit<NotificationOptions, 'type'>) => 
    notificationService.info(message, options),
  dismiss: (toastId?: string | number) => notificationService.dismiss(toastId),
};
