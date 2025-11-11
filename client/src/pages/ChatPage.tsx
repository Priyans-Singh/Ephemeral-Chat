import ChatPanel from "@/components/chat/ChatPanel";
import UserSidebar from "@/components/chat/UserSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from "@/lib/api";
import { toast } from 'sonner';
import { ConnectionStatus } from "@/components/ui/connection-status";
import { Button } from "@/components/ui/button";
import { PanelLeft } from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import type { MessageData } from "@/components/chat/MessageBubble";

interface User {
  id: string;
  displayName: string;
}

interface Group {
  id: string;
  name: string;
}

type SelectedChat = { type: 'dm'; data: User } | { type: 'group'; data: Group } | null;

const ChatPageContent = () => {
  const { socket, user: currentUser } = useAuth();
  const { toggleSidebar, isCollapsed } = useSidebar();
  const { themeConfig } = useTheme();
  const [selectedChat, setSelectedChat] = useState<SelectedChat>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  // Fetch groups
  const fetchGroups = useCallback(async () => {
    try {
      const response = await apiClient.get<Group[]>('/groups');
      setGroups(response.data);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Socket event handlers
  useEffect(() => {
    if (socket) {
      const handleReceiveMessage = (newMessage: MessageData) => {
        // Only add the message if it's part of the current conversation
        if (
          selectedChat?.type === 'dm' &&
          newMessage.recipient &&
          ((newMessage.sender.id === currentUser?.id && newMessage.recipient.id === selectedChat.data.id) ||
          (newMessage.sender.id === selectedChat.data.id && newMessage.recipient.id === currentUser?.id))
        ) {
          setMessages((prevMessages) => [...prevMessages, newMessage]);
        }
      };

      const handleReceiveGroupMessage = (newMessage: MessageData) => {
        // Only add the message if it belongs to the selected group
        if (selectedChat?.type === 'group' && newMessage.group && newMessage.group.id === selectedChat.data.id) {
          setMessages((prevMessages) => [...prevMessages, newMessage]);
        }
      };

      const handleError = (error: { message: string }) => {
        console.error('Socket error:', error);
        toast.error(error.message || 'An error occurred');
      };
      
      socket.on('receiveMessage', handleReceiveMessage);
      socket.on('receiveGroupMessage', handleReceiveGroupMessage);
      socket.on('error', handleError);
      
      return () => { 
        socket.off('receiveMessage', handleReceiveMessage);
        socket.off('receiveGroupMessage', handleReceiveGroupMessage);
        socket.off('error', handleError);
      };
    }
  }, [socket, selectedChat, currentUser]);

  // Fetch history when selecting a chat
  useEffect(() => {
    const fetchHistory = async () => {
      if (selectedChat) {
        setMessages([]); // Clear previous messages
        try {
          if (selectedChat.type === 'dm') {
            const response = await apiClient.get<MessageData[]>(`/chat/history/${selectedChat.data.id}`);
            setMessages(response.data);
          } else if (selectedChat.type === 'group') {
            // TODO: Add group message history API endpoint
            console.log('Fetching group history for:', selectedChat.data.id);
          }
        } catch (error) {
          console.error("Failed to fetch chat history:", error);
        }
      } else {
        setMessages([]); // Clear messages when no chat is selected
      }
    };
    fetchHistory();
  }, [selectedChat]);

  const handleSendMessage = (content: string) => {
    if (!socket || !selectedChat || !currentUser) {
      return;
    }
    
    if (selectedChat.type === 'dm') {
      socket.emit('sendMessage', {
        to: selectedChat.data.id,
        content,
      });
    } else if (selectedChat.type === 'group') {
      socket.emit('sendGroupMessage', {
        groupId: selectedChat.data.id,
        content,
      });
    }
  };

  const handleSelectChat = (chat: SelectedChat) => {
    setSelectedChat(chat);
  };

  const handleGroupCreated = () => {
    fetchGroups();
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
          onSelectChat={handleSelectChat}
          selectedChat={selectedChat}
          groups={groups}
          onGroupCreated={handleGroupCreated}
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
              selectedChat={selectedChat}
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