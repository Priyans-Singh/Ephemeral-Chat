import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';
import { FileAttachment } from './FileAttachment';
import { useAnimations } from '@/hooks/use-animations';

interface MessageInputProps {
  onSendMessage: (content: string, files?: File[]) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

export const MessageInput = ({
  onSendMessage,
  onTypingStart,
  onTypingStop,
  disabled = false,
  placeholder = "Type a message...",
  maxLength = 2000,
  className
}: MessageInputProps) => {
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { getEntranceProps, shouldAnimate } = useAnimations();

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 120; // Max height in pixels (about 5 lines)
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, []);

  // Handle typing indicators
  const handleTypingStart = useCallback(() => {
    if (!isTyping && onTypingStart) {
      setIsTyping(true);
      onTypingStart();
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (onTypingStop) {
        onTypingStop();
      }
    }, 2000); // Stop typing indicator after 2 seconds of inactivity
  }, [isTyping, onTypingStart, onTypingStop]);

  const handleTypingStop = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTyping(false);
    if (onTypingStop) {
      onTypingStop();
    }
  }, [onTypingStop]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    // Enforce max length
    if (value.length <= maxLength) {
      setInputValue(value);
      adjustTextareaHeight();
      
      // Handle typing indicators
      if (value.trim()) {
        handleTypingStart();
      } else {
        handleTypingStop();
      }
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart ?? inputValue.length;
      const end = textarea.selectionEnd ?? inputValue.length;
      const newValue = inputValue.slice(0, start) + emoji + inputValue.slice(end);
      setInputValue(newValue);
      
      // Set cursor position after emoji
      setTimeout(() => {
        if (textarea.selectionStart !== null && textarea.selectionEnd !== null) {
          textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        }
        textarea.focus();
      }, 0);
      
      adjustTextareaHeight();
    }
  };

  // Handle file selection
  const handleFileSelect = (files: File[]) => {
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const handleFileRemove = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedValue = inputValue.trim();
    
    if ((trimmedValue || attachedFiles.length > 0) && !disabled && !isSending) {
      setIsSending(true);
      handleTypingStop();
      
      try {
        onSendMessage(trimmedValue, attachedFiles.length > 0 ? attachedFiles : undefined);
        setInputValue("");
        setAttachedFiles([]);
        adjustTextareaHeight();
      } catch (error) {
        console.error('Failed to send message:', error);
      } finally {
        setIsSending(false);
        // Focus back to textarea after sending
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 100);
      }
    }
  };

  // Handle key down events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim() && !disabled && !isSending) {
        handleSubmit(e);
      }
    }
  };

  // Adjust height on mount and when value changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [adjustTextareaHeight]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const characterCount = inputValue.length;
  const isNearLimit = characterCount > maxLength * 0.8;
  const isAtLimit = characterCount >= maxLength;
  const canSend = (inputValue.trim() || attachedFiles.length > 0) && !disabled && !isSending;

  return (
    <motion.div
      className={cn("space-y-2 w-full", className)}
      {...getEntranceProps('slideUp')}
    >
      {/* Character count indicator */}
      <AnimatePresence>
        {(isNearLimit || isAtLimit) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="flex justify-end"
          >
            <span
              className={cn(
                "text-xs font-medium px-2 py-1 rounded-full",
                isAtLimit
                  ? "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20"
                  : "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/20"
              )}
            >
              {characterCount}/{maxLength}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File attachments */}
      <FileAttachment
        onFileSelect={handleFileSelect}
        onFileRemove={handleFileRemove}
        disabled={disabled || isSending}
      />

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2 w-full">
        <div className="flex-1 relative min-w-0">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isSending}
            rows={1}
            className={cn(
              "w-full resize-none rounded-lg border border-input bg-background px-3 py-2 pr-10",
              "text-sm placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "transition-all duration-200",
              "min-h-[40px] max-h-[120px] overflow-y-auto",
              isAtLimit && "border-red-500 focus:ring-red-500"
            )}
            style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(0,0,0,0.2) transparent'
            }}
          />
          
          {/* Emoji picker */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10">
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          </div>
          
          {/* Typing indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute -top-6 left-0 text-xs text-muted-foreground"
              >
                Typing...
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Send button */}
        <motion.div
          whileHover={shouldAnimate && canSend ? { scale: 1.05 } : {}}
          whileTap={shouldAnimate && canSend ? { scale: 0.95 } : {}}
          transition={{ duration: 0.1 }}
          className="flex-shrink-0"
        >
          <Button
            type="submit"
            size="sm"
            disabled={!canSend}
            aria-label="Send message"
            className="h-10 w-10 p-0 transition-all duration-200"
            animated={false}
          >
          <AnimatePresence mode="wait">
            {isSending ? (
              <motion.div
                key="loading"
                initial={shouldAnimate ? { opacity: 0, rotate: -90 } : { opacity: 1, rotate: 0 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={shouldAnimate ? { opacity: 0, rotate: 90 } : { opacity: 1, rotate: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Loader2 className="h-4 w-4 animate-spin" />
              </motion.div>
            ) : (
              <motion.div
                key="send"
                initial={shouldAnimate ? { opacity: 0, rotate: -90 } : { opacity: 1, rotate: 0 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={shouldAnimate ? { opacity: 0, rotate: 90 } : { opacity: 1, rotate: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Send className="h-4 w-4" />
              </motion.div>
            )}
          </AnimatePresence>
          </Button>
        </motion.div>
      </form>
    </motion.div>
  );
};

export default MessageInput;