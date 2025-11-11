import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble, type MessageData } from "./MessageBubble";
import { DateSeparator } from "./DateSeparator";
import { TypingIndicator } from "./TypingIndicator";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";

interface TypingUser {
  id: string;
  displayName: string;
}

interface MessageListProps {
  messages: MessageData[];
  currentUserId?: string;
  typingUsers?: TypingUser[];
  className?: string;
  isGroupChat?: boolean;
}

export const MessageList = ({ 
  messages, 
  currentUserId, 
  typingUsers = [],
  className,
  isGroupChat = false
}: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? "smooth" : "auto" 
      });

      // Fallback for scroll area
      setTimeout(() => {
        const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }
      }, 50);
    }
  };

  // Handle scroll events to detect if user is at bottom
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const threshold = 100; // pixels from bottom
    const atBottom = target.scrollHeight - target.scrollTop - target.clientHeight < threshold;
    setIsAtBottom(atBottom);
  };

  // Auto-scroll when new messages arrive (only if user is at bottom)
  useEffect(() => {
    if (isAtBottom && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isAtBottom]);

  // Scroll to bottom when component mounts
  useEffect(() => {
    scrollToBottom(false);
  }, []);

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, MessageData[]>);

  if (messages.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-2"
        >
          <div className="text-4xl">💬</div>
          <h3 className="text-lg font-medium text-muted-foreground">
            No messages yet
          </h3>
          <p className="text-sm text-muted-foreground/70">
            Start the conversation by sending a message
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <ScrollArea 
      className={cn("flex-1 overflow-hidden", className)} 
      ref={scrollAreaRef}
      onScrollCapture={handleScroll}
    >
      <div className="p-4 space-y-1 min-h-full">
        <AnimatePresence initial={false}>
          {Object.entries(groupedMessages).map(([dateString, dayMessages]) => {
            const date = new Date(dateString);
            
            return (
              <motion.div
                key={dateString}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <DateSeparator date={date} />
                
                <div className="space-y-3">
                  {dayMessages.map((message, index) => {
                    const isCurrentUser = message.sender.id === currentUserId;
                    const prevMessage = index > 0 ? dayMessages[index - 1] : null;
                    const nextMessage = index < dayMessages.length - 1 ? dayMessages[index + 1] : null;
                    
                    // Show avatar if it's the first message from this user in a sequence
                    const showAvatar = !prevMessage || prevMessage.sender.id !== message.sender.id;
                    
                    // Add extra spacing between different users
                    const isNewSender = !prevMessage || prevMessage.sender.id !== message.sender.id;
                    const isLastFromSender = !nextMessage || nextMessage.sender.id !== message.sender.id;
                    
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          isNewSender && "mt-4",
                          isLastFromSender && "mb-2"
                        )}
                      >
                        <MessageBubble
                          message={message}
                          isCurrentUser={isCurrentUser}
                          showAvatar={showAvatar}
                          showTimestamp={isLastFromSender}
                          showSenderName={isGroupChat && !isCurrentUser}
                        />
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {/* Typing indicators */}
        <TypingIndicator typingUsers={typingUsers} />
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {!isAtBottom && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={() => scrollToBottom()}
            className="fixed bottom-20 right-6 z-10 bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow duration-200 hover:scale-105"
            aria-label="Scroll to bottom"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </ScrollArea>
  );
};

export default MessageList;