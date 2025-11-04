import ChatPanel from "@/components/chat/ChatPanel";
import UserSidebar from "@/components/chat/UserSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { useState, useEffect } from 'react';
import { apiClient } from "@/lib/api";
import { toast } from 'sonner';
import { ConnectionStatus } from "@/components/ui/connection-status";
import { Button } from "@/components/ui/button";
import { PanelLeft } from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

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

const ChatPageContent = () => {
  const { socket, user: currentUser } = useAuth();
  const { toggleSidebar, isCollapsed } = useSidebar();
  const { themeConfig } = useTheme();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Socket event handlers
  useEffect(() => {
    if (socket) {
      const handleReceiveMessage = (newMessage: Message) => {
        // Only add the message if it's part of the current conversation
        if (
          (newMessage.sender.id === currentUser?.id && newMessage.recipient.id === selectedUser?.id) ||
          (newMessage.sender.id === selectedUser?.id && newMessage.recipient.id === currentUser?.id)
        ) {
          setMessages((prevMessages) => [...prevMessages, newMessage]);
        }
      };

      const handleError = (error: { message: string }) => {
        console.error('Socket error:', error);
        toast.error(error.message || 'An error occurred');
      };
      
      socket.on('receiveMessage', handleReceiveMessage);
      socket.on('error', handleError);
      
      return () => { 
        socket.off('receiveMessage', handleReceiveMessage);
        socket.off('error', handleError);
      };
    }
  }, [socket, selectedUser, currentUser]);

  // Fetch history when selecting a user
  useEffect(() => {
    const fetchHistory = async () => {
      if (selectedUser) {
        setMessages([]); // Clear previous messages
        try {
          const response = await apiClient.get<Message[]>(`/chat/history/${selectedUser.id}`);
          setMessages(response.data);
        } catch (error) {
          console.error("Failed to fetch chat history:", error);
        }
      } else {
        setMessages([]); // Clear messages when no user is selected
      }
    };
    fetchHistory();
  }, [selectedUser]);

  const handleSendMessage = (content: string) => {
    if (!socket || !selectedUser || !currentUser) {
      return;
    }
    
    socket.emit('sendMessage', {
      to: selectedUser.id,
      content,
    });
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
  };

  const headerVariants = {
    initial: { opacity: 0, y: -20 },
    animate: { 
      opacity: 1, 
      y: 0
    }
  };

  const headerTransition = {
    duration: themeConfig.animations ? 0.3 : 0,
    ease: [0.4, 0.0, 0.2, 1] as const
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <div className={`border-r border-border flex flex-col h-full bg-sidebar shadow-sm transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-80'
      }`}>
        <UserSidebar 
          onSelectUser={handleSelectUser}
          selectedUser={selectedUser}
          currentUserId={currentUser?.id}
        />
      </div>
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        <div className="flex flex-col h-full">
          {/* Header with sidebar trigger */}
          <motion.header 
            className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
            variants={headerVariants}
            initial="initial"
            animate="animate"
            transition={headerTransition}
          >
            <Button
              variant="ghost"
              size="icon"
              className="size-7 -ml-1 hover:bg-accent"
              onClick={toggleSidebar}
            >
              <PanelLeft className="h-4 w-4" />
              <span className="sr-only">Toggle Sidebar</span>
            </Button>
            <div className="flex-1" />
            <ConnectionStatus />
          </motion.header>
          
          {/* Main chat panel */}
          <div className="flex-1 overflow-hidden">
            <ChatPanel 
              user={selectedUser}
              messages={messages}
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export const ChatPage = () => {
  return (
    <SidebarProvider>
      <ChatPageContent />
    </SidebarProvider>
  );
};