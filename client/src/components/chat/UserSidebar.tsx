import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, PanelLeftClose, PanelRightClose } from 'lucide-react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { getInitials } from '@/lib/utils';
import './animations.css';

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
  currentUserId?: string;
}

export const UserSidebar = ({ onSelectUser, selectedUser, isCollapsed, onToggleCollapse, currentUserId }: UserSidebarProps) => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<Map<string, number>>(new Map());
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

      // Listen for new messages to update unread count
      socket.on('receiveMessage', (message: any) => {
        // Only count as unread if it's not from the currently selected user
        if (message.sender.id !== selectedUser?.id && message.sender.id !== currentUserId) {
          setUnreadMessages(prev => {
            const newMap = new Map(prev);
            const currentCount = newMap.get(message.sender.id) || 0;
            newMap.set(message.sender.id, currentCount + 1);
            return newMap;
          });
        }
      });

      // Clean up the listener when the component unmounts
      return () => {
        socket.off('users');
        socket.off('receiveMessage');
      };
    }
  }, [socket, user?.id, selectedUser?.id, currentUserId]); // Rerun the effect if the socket instance changes

  // Clear unread messages when a user is selected
  useEffect(() => {
    if (selectedUser) {
      setUnreadMessages(prev => {
        const newMap = new Map(prev);
        newMap.delete(selectedUser.id);
        return newMap;
      });
    }
  }, [selectedUser]);

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
            {onlineUsers.map((user) => {
              const unreadCount = unreadMessages.get(user.id) || 0;
              const hasUnread = unreadCount > 0;
              
              return (
                <Tooltip key={user.id}>
                  <TooltipTrigger asChild>
                    <div 
                      className={`relative flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-sm ${
                        selectedUser?.id === user.id 
                          ? 'bg-blue-100 dark:bg-blue-900 shadow-sm' 
                          : hasUnread
                          ? 'bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 user-item-unread'
                          : 'hover:bg-gray-200 dark:hover:bg-gray-800'
                      } ${isCollapsed ? 'justify-center' : 'space-x-3'}`}
                      onClick={() => onSelectUser(user)}
                    >
                      <div className="relative">
                        <Avatar className={`flex-shrink-0 ${hasUnread ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-900' : ''}`}>
                          <AvatarImage src={`https://api.dicebear.com/8.x/lorelei/svg?seed=${user.displayName}`} alt={user.displayName} />
                          <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                          <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 absolute bottom-0 right-0"></div>
                        </Avatar>
                        {/* Unread indicator for collapsed state */}
                        {isCollapsed && hasUnread && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-medium unread-pulse unread-glow">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </div>
                        )}
                      </div>
                      {!isCollapsed && (
                        <div className="overflow-hidden whitespace-nowrap flex-1 flex items-center justify-between">
                          <div className="overflow-hidden">
                            <span className={`truncate block ${hasUnread ? 'font-semibold text-blue-900 dark:text-blue-100' : 'font-medium'}`}>
                              {user.displayName}
                            </span>
                            <p className={`text-sm truncate ${hasUnread ? 'text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                              {hasUnread ? `${unreadCount} new message${unreadCount > 1 ? 's' : ''}` : 'Last seen recently'}
                            </p>
                          </div>
                          {/* Unread badge for expanded state */}
                          {hasUnread && (
                            <div className="ml-2 w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-medium flex-shrink-0 unread-pulse unread-bounce">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">
                      <div>
                        <div className="font-medium">{user.displayName}</div>
                        {hasUnread && (
                          <div className="text-xs text-blue-300">
                            {unreadCount} new message{unreadCount > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
            {onlineUsers.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <p>{isCollapsed ? "No users" : "No other users online"}</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer Section */}
        <div className="mt-auto flex flex-col space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                className={`w-full flex items-center space-x-3 cursor-pointer footer-button-hover hover:shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 ${isCollapsed ? 'justify-center' : 'justify-start'}`}
                onClick={() => console.log('Settings clicked')}
              >
                <Settings className="h-4 w-4 flex-shrink-0 transition-transform duration-200 hover:rotate-90" />
                {!isCollapsed && <span className="transition-colors duration-200">Settings</span>}
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
                className={`w-full flex items-center space-x-3 cursor-pointer footer-button-hover hover:shadow-md hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400 ${isCollapsed ? 'justify-center' : 'justify-start'}`}
                onClick={logout}
              >
                <LogOut className="h-4 w-4 text-red-500 flex-shrink-0 transition-all duration-200 hover:text-red-600 dark:hover:text-red-400 hover:translate-x-1" />
                {!isCollapsed && <span className="transition-colors duration-200">Logout</span>}
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