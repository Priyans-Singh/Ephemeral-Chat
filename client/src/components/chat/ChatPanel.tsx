import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { format } from 'date-fns';

interface User {
  id: string;
  displayName: string;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    displayName: string;
  };
  recipient: {
    id: string;
    displayName: string;
  };
}

interface ChatPanelProps {
  user: User | null;
  messages: Message[];
  onSendMessage: (content: string) => void;
}

// Helper functions for date formatting
const isToday = (date: Date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const isYesterday = (date: Date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
};

const formatTimestamp = (date: Date) => {
  return format(date, 'h:mm a');
};

const formatDateSeparator = (date: Date) => {
  if (isToday(date)) {
    return 'Today';
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else {
    return format(date, 'MMMM d, yyyy');
  }
};

export const ChatPanel = ({ user, messages, onSendMessage }: ChatPanelProps) => {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { user: currentUser } = useAuth();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      // Try scrollIntoView first
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });

      // Fallback: try to find the viewport and scroll manually
      setTimeout(() => {
        const viewport = scrollAreaRef.current?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement;
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }
      }, 50);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Also scroll to bottom when user changes (opening a new chat)
  useEffect(() => {
    if (user) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(scrollToBottom, 150);
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && user) {
      onSendMessage(inputValue.trim());
      setInputValue("");
      // Scroll to bottom after sending message
      setTimeout(scrollToBottom, 100);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-500 dark:text-gray-400">
            Select a user to start chatting
          </h2>
          <p className="text-gray-400 dark:text-gray-500 mt-2">
            Choose someone from the sidebar to begin your conversation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Chat Header */}
      <header className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <h2 className="text-xl font-bold">{user.displayName}</h2>
      </header>

      {/* Messages Area */}
      <ScrollArea className="flex-1 overflow-hidden" ref={scrollAreaRef}>
        <div className="p-4 space-y-4 min-h-full">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isCurrentUser = msg.sender.id === currentUser?.id;
              const messageDate = new Date(msg.createdAt);
              const prevMessageDate = index > 0 ? new Date(messages[index - 1].createdAt) : null;
              const showDateSeparator = !prevMessageDate ||
                messageDate.toDateString() !== prevMessageDate.toDateString();

              return (
                <div key={msg.id}>
                  {/* Date Separator */}
                  {showDateSeparator && (
                    <div className="flex justify-center my-4">
                      <div className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-3 py-1 rounded-full">
                        {formatDateSeparator(messageDate)}
                      </div>
                    </div>
                  )}

                  {/* Message */}
                  <div className={`flex items-end gap-2 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage
                        src={`https://api.dicebear.com/8.x/lorelei/svg?seed=${msg.sender.displayName}`}
                        alt={msg.sender.displayName}
                      />
                      <AvatarFallback className="text-xs">{msg.sender.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>

                    <div className={`flex flex-col max-w-xs lg:max-w-md ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`py-2 px-3 shadow-sm break-words ${isCurrentUser
                            ? 'bg-blue-500 text-white rounded-lg rounded-br-none'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg rounded-bl-none'
                          }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <p className={`text-xs mt-1 px-1 ${isCurrentUser ? 'text-gray-500' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                        {formatTimestamp(messageDate)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {/* Invisible element to scroll to */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <footer className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Type a message..."
            className="flex-1"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (inputValue.trim()) {
                  handleSubmit(e);
                }
              }
            }}
            autoComplete="off"
          />
          <Button
            type="submit"
            disabled={!inputValue.trim()}
            onClick={(e) => {
              e.preventDefault();
              if (inputValue.trim()) {
                handleSubmit(e);
              }
            }}
          >
            Send
          </Button>
        </form>
      </footer>
    </div>
  );
};

export default ChatPanel;