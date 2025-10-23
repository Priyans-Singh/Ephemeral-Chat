import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, PanelLeftClose, PanelRightClose } from 'lucide-react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { getInitials } from '@/lib/utils';

// Define a type for the user object we expect from the backend
interface OnlineUser {
    id: string;
    displayName: string;
}

interface UserSidebarProps {
  onSelectUser: (user: OnlineUser) => void;
  selectedUser: OnlineUser | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const UserSidebar = ({ onSelectUser, selectedUser, isCollapsed, onToggleCollapse }: UserSidebarProps) => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const { socket, user, logout } = useAuth(); // Get the socket and logout from our AuthContext

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
    <TooltipProvider>
      <div className="flex flex-col h-full p-4">
        {/* Header Section */}
        <div className={`flex items-center mb-4 flex-shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && <h2 className="text-2xl font-bold">Chats</h2>}
          <Button variant="ghost" size="icon" onClick={onToggleCollapse}>
            {isCollapsed ? <PanelRightClose className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>

        {/* User List */}
        <ScrollArea className="flex-1">
          <div className="space-y-2 overflow-y-auto pr-2">
            {onlineUsers.map((user) => (
              <Tooltip key={user.id}>
                <TooltipTrigger asChild>
                  <div 
                    className={`relative flex items-center p-3 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors ${
                      selectedUser?.id === user.id ? 'bg-blue-100 dark:bg-blue-900' : ''
                    } ${isCollapsed ? 'justify-center' : 'space-x-3'}`}
                    onClick={() => onSelectUser(user)}
                  >
                    <div className="relative">
                      <Avatar className="flex-shrink-0">
                        <AvatarImage src={`https://api.dicebear.com/8.x/lorelei/svg?seed=${user.displayName}`} alt={user.displayName} />
                        <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                        <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 absolute bottom-0 right-0"></div>
                      </Avatar>
                    </div>
                    {!isCollapsed && (
                      <div className="overflow-hidden whitespace-nowrap flex-1">
                        <span className="truncate font-medium">{user.displayName}</span>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">Last seen recently</p>
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right">
                    {user.displayName}
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
            {onlineUsers.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <p>{isCollapsed ? "No users" : "No other users online"}</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer Section */}
        <div className="mt-auto flex flex-col space-y-2 pt-4 border-t">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                className={`w-full flex items-center space-x-3 ${isCollapsed ? 'justify-center' : 'justify-start'}`}
                onClick={() => console.log('Settings clicked')}
              >
                <Settings className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span>Settings</span>}
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">
                Settings
              </TooltipContent>
            )}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                className={`w-full flex items-center space-x-3 ${isCollapsed ? 'justify-center' : 'justify-start'}`}
                onClick={logout}
              >
                <LogOut className="h-4 w-4 text-red-500 flex-shrink-0" />
                {!isCollapsed && <span>Logout</span>}
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">
                Logout
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default UserSidebar;