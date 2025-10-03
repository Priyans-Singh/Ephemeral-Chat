import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Define a type for the user object we expect from the backend
interface OnlineUser {
    id: string;
    displayName: string;
}

export const UserSidebar = () => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const { socket } = useAuth(); // Get the socket from our AuthContext

  useEffect(() => {
    // Ensure the socket is connected before setting up listeners
    if (socket) {
      // Listen for the 'users' event from the server
      socket.on('users', (users: OnlineUser[]) => {
        setOnlineUsers(users);
      });

      // Clean up the listener when the component unmounts
      return () => {
        socket.off('users');
      };
    }
  }, [socket]); // Rerun the effect if the socket instance changes

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold mb-4">Online Users</h2>
      <div className="flex-1 space-y-2">
        {onlineUsers.map((user) => (
          <div key={user.id} className="flex items-center space-x-3 p-2 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800">
            <Avatar>
              <AvatarImage src={`https://api.dicebear.com/8.x/lorelei/svg?seed=${user.displayName}`} alt={user.displayName} />
              <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <span>{user.displayName}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserSidebar;