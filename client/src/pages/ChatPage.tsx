import { ChatLayout } from "@/components/chat/ChatLayout";
import ChatPanel from "@/components/chat/ChatPanel";
import UserSidebar from "@/components/chat/UserSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from 'react';
import { apiClient } from "@/lib/api";

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
  const { logout, socket, user: currentUser } = useAuth();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Receive message handler: only add if for active conversation
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
      
      socket.on('receiveMessage', handleReceiveMessage);
      return () => { socket.off('receiveMessage', handleReceiveMessage); };
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

  return (
    <div className="relative h-screen overflow-hidden">
      <ChatLayout
        sidebar={
          <UserSidebar 
            onSelectUser={handleSelectUser}
            selectedUser={selectedUser}
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
      {/* Keep the logout button for now, styled to be in the top right */}
      <div className="absolute top-4 right-4 z-10">
        <Button onClick={logout} variant="destructive" size="sm">
          Logout
        </Button>
      </div>
    </div>
  );
};