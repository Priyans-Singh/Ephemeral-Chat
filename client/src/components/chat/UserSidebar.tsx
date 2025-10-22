import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

// Define a type for the user object we expect from the backend
interface OnlineUser {
    id: string;
    displayName: string;
}

interface UserSidebarProps {
  onSelectUser: (user: OnlineUser) => void;
  selectedUser: OnlineUser | null;
}

export const UserSidebar = ({ onSelectUser, selectedUser }: UserSidebarProps) => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const { socket, user } = useAuth(); // Get the socket from our AuthContext

  useEffect(() => {
    // Ensure the socket is connected before setting up listeners
    if (socket) {
      // Listen for the 'users' event from the server
      socket.on('users', (users: OnlineUser[]) => {
        // Filter out the current user from the list
        const otherUsers = users.filter(u => u.id !== user?.id);
        setOnlineUsers(otherUsers);
      });

      // Clean up the listener when the component unmounts
      return () => {
        socket.off('users');
      };
    }
  }, [socket, user?.id]); // Rerun the effect if the socket instance changes

  return (
    <div className="flex flex-col h-full p-4">
      <h2 className="text-2xl font-bold mb-4 flex-shrink-0">Online Users</h2>
      <ScrollArea className="flex-1">
        <div className="space-y-2 pr-4">
          {onlineUsers.map((user) => (
            <div 
              key={user.id} 
              className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors ${
                selectedUser?.id === user.id ? 'bg-blue-100 dark:bg-blue-900' : ''
              }`}
              onClick={() => onSelectUser(user)}
            >
              <Avatar className="flex-shrink-0">
                <AvatarImage src={`https://api.dicebear.com/8.x/lorelei/svg?seed=${user.displayName}`} alt={user.displayName} />
                <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="truncate">{user.displayName}</span>
            </div>
          ))}
          {onlineUsers.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <p>No other users online</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default UserSidebar;