import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

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

export const ChatPanel = ({ user, messages, onSendMessage }: ChatPanelProps) => {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user: currentUser } = useAuth();

  // Auto-scroll to bottom when new messages arrive or when opening a chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Also scroll to bottom when user changes (opening a new chat)
  useEffect(() => {
    if (user && messages.length > 0) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(scrollToBottom, 100);
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && user) {
      onSendMessage(inputValue.trim());
      setInputValue("");
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
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="p-4 space-y-4 min-h-full">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isCurrentUser = msg.sender.id === currentUser?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar className="flex-shrink-0">
                    <AvatarImage 
                      src={`https://api.dicebear.com/8.x/lorelei/svg?seed=${msg.sender.displayName}`} 
                      alt={msg.sender.displayName}
                    />
                    <AvatarFallback>{msg.sender.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div
                    className={`rounded-lg p-3 max-w-xs lg:max-w-md break-words ${
                      isCurrentUser
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-xs mt-1 ${
                      isCurrentUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </p>
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