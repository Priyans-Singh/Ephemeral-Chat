import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { presenceService, type UserPresence, type PresenceStatus } from '@/lib/presence-service';

interface PresenceIndicatorProps {
  userId: string;
  presence?: UserPresence | null;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  animate?: boolean;
}

export const PresenceIndicator = ({ 
  userId, 
  presence, 
  size = 'md', 
  showText = false, 
  className,
  animate = true 
}: PresenceIndicatorProps) => {
  const userPresence = presence || presenceService.getUserPresence(userId);
  
  if (!userPresence) return null;

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const colorClass = presenceService.getPresenceColor(userPresence.status);
  const statusText = presenceService.getPresenceText(userPresence);

  const indicator = (
    <div
      className={cn(
        'rounded-full border-2 border-background transition-colors duration-200',
        sizeClasses[size],
        colorClass,
        className
      )}
      title={statusText}
    />
  );

  const content = (
    <div className="flex items-center gap-2">
      {animate ? (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {indicator}
        </motion.div>
      ) : (
        indicator
      )}
      
      {showText && (
        <span className={cn('text-muted-foreground', textSizeClasses[size])}>
          {statusText}
        </span>
      )}
    </div>
  );

  // Add pulse animation for online status
  if (animate && userPresence.status === 'online') {
    return (
      <div className="relative">
        {content}
        <motion.div
          className={cn(
            'absolute top-0 left-0 rounded-full',
            sizeClasses[size],
            colorClass,
            'opacity-75'
          )}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.75, 0, 0.75],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
    );
  }

  return content;
};

interface TypingIndicatorProps {
  userId: string;
  displayName: string;
  className?: string;
}

export const TypingIndicator = ({ userId, displayName, className }: TypingIndicatorProps) => {
  const presence = presenceService.getUserPresence(userId);
  
  if (!presence?.isTyping) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}
    >
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 bg-primary rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
      <span>{displayName} is typing...</span>
    </motion.div>
  );
};

interface PresenceStatusBadgeProps {
  status: PresenceStatus;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PresenceStatusBadge = ({ status, className, size = 'md' }: PresenceStatusBadgeProps) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  const statusConfig = {
    online: {
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      text: 'Online'
    },
    away: {
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      text: 'Away'
    },
    offline: {
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      text: 'Offline'
    }
  };

  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium transition-colors',
        sizeClasses[size],
        config.color,
        className
      )}
    >
      {config.text}
    </span>
  );
};