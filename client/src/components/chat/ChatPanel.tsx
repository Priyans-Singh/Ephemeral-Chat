import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import type { MessageData } from "./MessageBubble";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from 'framer-motion';
import { useState, useEffect } from "react";
import { presenceService } from '@/lib/presence-service';
// Removed unused import

interface TypingUser {
  id: string;
  displayName: string;
}

interface User {
  id: string;
  displayName: string;
}

// Use MessageData from MessageBubble component
type Message = MessageData;

interface ChatPanelProps {
  user: User | null;
  messages: Message[];
  onSendMessage: (content: string, files?: File[]) => void;
}

// Helper functions moved to MessageBubble and DateSeparator components

export const ChatPanel = ({ user, messages, onSendMessage }: ChatPanelProps) => {
  const { user: currentUser, socket } = useAuth();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  // Removed unused state

  // Subscribe to presence service
  useEffect(() => {
    const unsubscribe = presenceService.subscribe((presence) => {
      // Removed unused presence state
    });
    return unsubscribe;
  }, []);

  const handleSendMessage = (content: string, files?: File[]) => {
    if (user) {
      // For now, just handle text messages. File upload would need backend support
      if (files && files.length > 0) {
        console.log('Files to upload:', files);
        // TODO: Implement file upload to server
      }
      onSendMessage(content, files);
    }
  };

  const handleTypingStart = () => {
    if (socket && user) {
      socket.emit('typing', { to: user.id, typing: true });
    }
  };

  const handleTypingStop = () => {
    if (socket && user) {
      socket.emit('typing', { to: user.id, typing: false });
    }
  };

  // Socket listeners for typing events
  useEffect(() => {
    if (socket) {
      const handleTyping = (data: { userId: string, displayName: string, typing: boolean }) => {
        // Update presence service with typing status
        presenceService.setTyping(data.userId, data.typing);
        
        // Also update local state for backward compatibility
        if (data.typing) {
          setTypingUsers(prev => [...prev.filter(u => u.id !== data.userId), { id: data.userId, displayName: data.displayName }]);
        } else {
          setTypingUsers(prev => prev.filter(u => u.id !== data.userId));
        }
      };

      socket.on('userTyping', handleTyping);
      return () => {
        socket.off('userTyping', handleTyping);
      };
    }
  }, [socket]);

  if (!user) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <div className="text-6xl">💬</div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Select a user to start chatting
            </h2>
            <p className="text-muted-foreground">
              Choose someone from the sidebar to begin your conversation
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-shrink-0 p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <h2 className="text-xl font-bold text-foreground">{user.displayName}</h2>
      </motion.header>

      {/* Messages Area */}
      <MessageList
        messages={messages}
        currentUserId={currentUser?.id}
        typingUsers={typingUsers}
        className="flex-1"
      />

      {/* Message Input */}
      <footer className="flex-shrink-0 p-4 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <MessageInput
          onSendMessage={handleSendMessage}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
          disabled={!user}
          placeholder={`Message ${user?.displayName || ''}...`}
        />
      </footer>
    </div>
  );
};

export default ChatPanel;