import { ChatLayout } from "@/components/chat/ChatLayout";
import ChatPanel from "@/components/chat/ChatPanel";
import UserSidebar from "@/components/chat/UserSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from 'react';
import { apiClient } from "@/lib/api";
import { toast } from 'sonner';
import { ConnectionStatus } from "@/components/ui/connection-status";

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

export const ChatPage = () => {
  const { socket, user: currentUser } = useAuth();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="relative h-screen overflow-hidden">
      <ChatLayout
        isCollapsed={isSidebarCollapsed}
        sidebar={
          <UserSidebar 
            onSelectUser={handleSelectUser}
            selectedUser={selectedUser}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={toggleSidebar}
            currentUserId={currentUser?.id}
          />
        }
        mainPanel={
          <ChatPanel 
            user={selectedUser}
            messages={messages}
            onSendMessage={handleSendMessage}
          />
        }
      />
      {/* Connection Status Indicator */}
      <div className="absolute top-4 right-4 z-10">
        <ConnectionStatus />
      </div>
    </div>
  );
};