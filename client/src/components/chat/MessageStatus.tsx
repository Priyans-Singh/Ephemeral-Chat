import { cn } from "@/lib/utils";
import { motion } from 'framer-motion';
import { Check, CheckCheck, AlertCircle, Loader2 } from 'lucide-react';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'error';

interface MessageStatusProps {
  status: MessageStatus;
  timestamp?: Date;
  showText?: boolean;
  className?: string;
}

const statusConfig = {
  sending: {
    icon: Loader2,
    color: 'text-muted-foreground',
    text: 'Sending...',
    animate: true
  },
  sent: {
    icon: Check,
    color: 'text-muted-foreground',
    text: 'Sent',
    animate: false
  },
  delivered: {
    icon: CheckCheck,
    color: 'text-muted-foreground',
    text: 'Delivered',
    animate: false
  },
  read: {
    icon: CheckCheck,
    color: 'text-blue-500',
    text: 'Read',
    animate: false
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-500',
    text: 'Failed to send',
    animate: false
  }
};

export const MessageStatus = ({ 
  status, 
  timestamp, 
  showText = false, 
  className 
}: MessageStatusProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex items-center gap-1 text-xs",
        config.color,
        className
      )}
    >
      <Icon 
        className={cn(
          "h-3 w-3",
          config.animate && "animate-spin"
        )} 
      />
      
      {showText && (
        <span className="font-medium">
          {config.text}
        </span>
      )}
      
      {timestamp && !showText && (
        <span className="opacity-70">
          {timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      )}
    </motion.div>
  );
};

export default MessageStatus;