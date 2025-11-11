import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from 'date-fns';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { motion } from 'framer-motion';
import { useAnimations } from '@/hooks/use-animations';
import { MessageStatus, type MessageStatus as MessageStatusType } from './MessageStatus';

// Re-export MessageStatus type
export type { MessageStatus } from './MessageStatus';

export interface MessageData {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    displayName: string;
  };
  recipient?: {
    id: string;
    displayName: string;
  };
  group?: {
    id: string;
    name: string;
  };
  status?: MessageStatusType;
}

interface MessageBubbleProps {
  message: MessageData;
  isCurrentUser: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  showSenderName?: boolean;
  className?: string;
}

const formatTimestamp = (date: Date): string => {
  if (isToday(date)) {
    return format(date, 'h:mm a');
  } else if (isYesterday(date)) {
    return `Yesterday ${format(date, 'h:mm a')}`;
  } else {
    return format(date, 'MMM d, h:mm a');
  }
};

const getRelativeTime = (date: Date): string => {
  return formatDistanceToNow(date, { addSuffix: true });
};

// StatusIcon component removed - using MessageStatus component instead

export const MessageBubble = ({
  message,
  isCurrentUser,
  showAvatar = true,
  showTimestamp = true,
  showSenderName = false,
  className
}: MessageBubbleProps) => {
  const messageDate = new Date(message.createdAt);
  const { getEntranceProps, getHoverProps, shouldAnimate } = useAnimations();

  return (
    <motion.div
      className={cn(
        "flex items-end gap-3 group",
        isCurrentUser ? "flex-row-reverse" : "flex-row",
        className
      )}
      {...getEntranceProps('messageEnter')}
    >
      {/* Avatar */}
      {showAvatar && (
        <motion.div
          initial={shouldAnimate ? { scale: 0 } : { scale: 1 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, duration: 0.2 }}
        >
          <Avatar className="h-8 w-8 flex-shrink-0 ring-2 ring-background">
            <AvatarImage
              src={`https://api.dicebear.com/8.x/lorelei/svg?seed=${message.sender.displayName}`}
              alt={message.sender.displayName}
            />
            <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {message.sender.displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </motion.div>
      )}

      {/* Message Content */}
      <div className={cn(
        "flex flex-col max-w-xs sm:max-w-sm lg:max-w-md xl:max-w-lg",
        isCurrentUser ? "items-end" : "items-start"
      )}>
        {/* Sender name (for group chats) */}
        {showSenderName && (
          <div className="text-xs font-medium text-muted-foreground mb-1 px-1">
            {message.sender.displayName}
          </div>
        )}

        {/* Message bubble */}
        <motion.div
          {...(shouldAnimate ? getHoverProps() : {})}
          className={cn(
            "relative py-3 px-4 shadow-sm break-words rounded-2xl",
            "transition-all duration-200 ease-out",
            "hover:shadow-md",
            isCurrentUser
              ? cn(
                  "bg-gradient-to-br from-blue-500 to-blue-600 text-white",
                  "rounded-br-md",
                  "shadow-blue-500/20"
                )
              : cn(
                  "bg-card text-card-foreground border border-border/50",
                  "rounded-bl-md",
                  "hover:bg-accent/50"
                )
          )}
        >
          {/* Message content */}
          <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
            {message.content}
          </p>

          {/* Message status indicator for sent messages */}
          {isCurrentUser && message.status && (
            <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 shadow-sm border border-border/20">
              <MessageStatus status={message.status} />
            </div>
          )}
        </motion.div>

        {/* Timestamp and status */}
        {showTimestamp && (
          <div className={cn(
            "flex items-center gap-1 mt-1 px-1",
            "text-xs text-muted-foreground",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
            isCurrentUser ? "flex-row-reverse" : "flex-row"
          )}>
            <span title={getRelativeTime(messageDate)}>
              {formatTimestamp(messageDate)}
            </span>
            {isCurrentUser && message.status && (
              <MessageStatus status={message.status} />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MessageBubble;