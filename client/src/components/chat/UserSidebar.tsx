import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  LogOut, 
  Settings, 
  Users, 
  Filter, 
  Moon, 
  Sun, 
  Monitor, 
  User, 
  Palette,
  Bell,
  Shield,
  Plus
} from 'lucide-react';
import { CreateGroupModal } from './CreateGroupModal';

import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useSidebar } from "@/contexts/SidebarContext";
import { getInitials } from '@/lib/utils';

import './animations.css';

// Define a type for the user object we expect from the backend
interface OnlineUser {
    id: string;
    displayName: string;
}

interface Group {
  id: string;
  name: string;
}

type SelectedChat = { type: 'dm'; data: OnlineUser } | { type: 'group'; data: Group } | null;

// Settings Dropdown Component
const SettingsDropdown = ({ 
  isCollapsed
}: { 
  isCollapsed: boolean;
}) => {
  const { theme, setTheme, themeConfig, setAnimations } = useTheme();

  const getThemeIcon = (themeMode: string) => {
    switch (themeMode) {
      case 'light': return <Sun className="mr-2 h-4 w-4" />;
      case 'dark': return <Moon className="mr-2 h-4 w-4" />;
      case 'system': return <Monitor className="mr-2 h-4 w-4" />;
      default: return <Monitor className="mr-2 h-4 w-4" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`w-full justify-start h-auto p-2 hover:bg-muted ${isCollapsed ? 'px-2' : 'px-3'}`}
          title={isCollapsed ? "Settings" : undefined}
        >
          <Settings className="h-4 w-4 transition-transform duration-200 hover:rotate-90" />
          {!isCollapsed && <span className="ml-3">Settings</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56">
        <DropdownMenuLabel>Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Theme Selection */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {getThemeIcon(theme)}
            <span>Theme</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => setTheme('light')}>
              <Sun className="mr-2 h-4 w-4" />
              <span>Light</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              <Monitor className="mr-2 h-4 w-4" />
              <span>System</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuItem>
          <Bell className="mr-2 h-4 w-4" />
          <span>Notifications</span>
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Palette className="mr-2 h-4 w-4" />
          <span>Appearance</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => setAnimations(!themeConfig.animations)}>
          <span className="mr-2 h-4 w-4 flex items-center justify-center">
            {themeConfig.animations ? '✓' : '○'}
          </span>
          <span>Animations</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Logout Button Component with Confirmation
const LogoutButton = ({ isCollapsed, onLogout }: { isCollapsed: boolean; onLogout: () => void }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleLogout = () => {
    if (showConfirmation) {
      onLogout();
      setShowConfirmation(false);
    } else {
      setShowConfirmation(true);
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => setShowConfirmation(false), 3000);
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleLogout}
      className={`w-full justify-start h-auto p-2 transition-all duration-200 ${isCollapsed ? 'px-2' : 'px-3'} ${
        showConfirmation 
          ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700' 
          : 'hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400'
      }`}
      title={isCollapsed ? (showConfirmation ? "Click to confirm logout" : "Logout") : undefined}
    >
      <LogOut className={`h-4 w-4 transition-all duration-200 ${
        showConfirmation 
          ? 'text-red-600 dark:text-red-400 animate-pulse' 
          : 'text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:translate-x-1'
      }`} />
      {!isCollapsed && (
        <span className="ml-3">{showConfirmation ? 'Confirm Logout' : 'Logout'}</span>
      )}
    </Button>
  );
};

interface UserSidebarProps {
  onSelectChat: (chat: SelectedChat) => void;
  selectedChat: SelectedChat;
  groups: Group[];
  onGroupCreated: () => void;
}

const UserSidebar = ({ onSelectChat, selectedChat, groups, onGroupCreated }: UserSidebarProps) => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<Map<string, number>>(new Map());
  const [userPresence, setUserPresence] = useState<Map<string, 'online' | 'away' | 'offline'>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState<'none' | 'status' | 'unread'>('none');

  const { socket, user, logout } = useAuth();
  const { isCollapsed } = useSidebar();



  useEffect(() => {
    if (socket) {
      socket.on('users', (users: OnlineUser[]) => {
        const otherUsers = users.filter(u => u.id !== user?.id);
        setOnlineUsers(otherUsers);
        
        // Set all users as online initially
        const presenceMap = new Map();
        otherUsers.forEach(u => presenceMap.set(u.id, 'online'));
        setUserPresence(presenceMap);
      });

      socket.on('receiveMessage', (message: any) => {
        if (selectedChat?.type === 'dm' && message.sender.id !== selectedChat.data.id && message.sender.id !== user?.id) {
          setUnreadMessages(prev => {
            const newMap = new Map(prev);
            const currentCount = newMap.get(message.sender.id) || 0;
            newMap.set(message.sender.id, currentCount + 1);
            return newMap;
          });
        }
      });

      // Listen for user presence updates
      socket.on('userPresenceUpdate', (data: { userId: string; status: 'online' | 'away' | 'offline' }) => {
        setUserPresence(prev => {
          const newMap = new Map(prev);
          newMap.set(data.userId, data.status);
          return newMap;
        });
      });

      return () => {
        socket.off('users');
        socket.off('receiveMessage');
        socket.off('userPresenceUpdate');
      };
    }
  }, [socket, user?.id, selectedChat]);

  useEffect(() => {
    if (selectedChat?.type === 'dm') {
      setUnreadMessages(prev => {
        const newMap = new Map(prev);
        newMap.delete(selectedChat.data.id);
        return newMap;
      });
    }
  }, [selectedChat]);

  // Filter and group users
  const filteredUsers = onlineUsers.filter(user =>
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedUsers = () => {
    if (groupBy === 'none') {
      return [{ label: 'All Users', users: filteredUsers }];
    }
    
    if (groupBy === 'status') {
      const online = filteredUsers.filter(u => userPresence.get(u.id) === 'online');
      const away = filteredUsers.filter(u => userPresence.get(u.id) === 'away');
      const offline = filteredUsers.filter(u => userPresence.get(u.id) === 'offline');
      
      return [
        { label: 'Online', users: online },
        { label: 'Away', users: away },
        { label: 'Offline', users: offline }
      ].filter(group => group.users.length > 0);
    }
    
    if (groupBy === 'unread') {
      const withUnread = filteredUsers.filter(u => (unreadMessages.get(u.id) || 0) > 0);
      const withoutUnread = filteredUsers.filter(u => (unreadMessages.get(u.id) || 0) === 0);
      
      return [
        { label: 'Unread Messages', users: withUnread },
        { label: 'All Conversations', users: withoutUnread }
      ].filter(group => group.users.length > 0);
    }
    
    return [{ label: 'All Users', users: filteredUsers }];
  };

  // Removed unused function

  const getPresenceText = (userId: string) => {
    const status = userPresence.get(userId) || 'online';
    switch (status) {
      case 'online': return 'Online';
      case 'away': return 'Away';
      case 'offline': return 'Last seen recently';
      default: return 'Online';
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {!isCollapsed && (
            <>
              <span className="font-semibold">Chats</span>
              <div className="ml-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setGroupBy('none')}>
                      All Users
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setGroupBy('status')}>
                      Group by Status
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setGroupBy('unread')}>
                      Group by Unread
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}
        </div>
        {!isCollapsed && (
          <div className="mt-2">
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8"
            />
          </div>
        )}
        <div className="mt-2">
          <CreateGroupModal socket={socket} onGroupCreated={onGroupCreated}>
            <Button
              variant="outline"
              className={`w-full justify-start h-auto p-2 ${isCollapsed ? 'px-2' : 'px-3'}`}
              title={isCollapsed ? "New Group" : undefined}
            >
              <Plus className="h-4 w-4" />
              {!isCollapsed && <span className="ml-3">New Group</span>}
            </Button>
          </CreateGroupModal>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Groups Section */}
        <div className="p-2">
          {!isCollapsed && (
            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Groups
            </div>
          )}
          <div className="space-y-1">
            {groups.map((group) => {
              const isActive = selectedChat?.type === 'group' && selectedChat.data.id === group.id;
              
              return (
                <Button
                  key={group.id}
                  variant={isActive ? "secondary" : "ghost"}
                  onClick={() => onSelectChat({ type: 'group', data: group })}
                  className={`w-full justify-start h-auto p-2 transition-all duration-200 hover:scale-[1.02] ${isCollapsed ? 'px-2' : 'px-3'}`}
                  title={isCollapsed ? group.name : undefined}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/10">
                      <Users className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 overflow-hidden ml-3 text-left">
                      <span className="truncate block font-medium">
                        {group.name}
                      </span>
                    </div>
                  )}
                </Button>
              );
            })}
          </div>
          {groups.length === 0 && !isCollapsed && (
            <div className="text-center text-muted-foreground py-4 px-2">
              <p className="text-xs">No groups yet</p>
            </div>
          )}
        </div>

        {/* Direct Messages Section */}
        <div>
          {groupedUsers().map((group, groupIndex) => (
            <div key={groupIndex} className="p-2">
              {!isCollapsed && (
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {groupIndex === 0 ? 'Direct Messages' : group.label}
                </div>
              )}
              <div className="space-y-1">
              {group.users.map((user) => {
                const unreadCount = unreadMessages.get(user.id) || 0;
                const hasUnread = unreadCount > 0;
                const isActive = selectedChat?.type === 'dm' && selectedChat.data.id === user.id;
                const presence = userPresence.get(user.id);
                const presenceText = getPresenceText(user.id);
                
                return (
                  <Button
                    key={user.id}
                    variant={isActive ? "secondary" : "ghost"}
                    onClick={() => onSelectChat({ type: 'dm', data: user })}
                    className={`w-full justify-start h-auto p-2 transition-all duration-200 hover:scale-[1.02] ${
                      hasUnread && !isActive ? 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800' : ''
                    } ${isCollapsed ? 'px-2' : 'px-3'}`}
                    title={isCollapsed ? `${user.displayName} (${presenceText})` : undefined}
                  >
                    <div className="relative">
                      <Avatar className={`h-8 w-8 transition-all duration-200 ${
                        hasUnread ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-background' : ''
                      }`}>
                        <AvatarImage 
                          src={`https://api.dicebear.com/8.x/lorelei/svg?seed=${user.displayName}`} 
                          alt={user.displayName} 
                        />
                        <AvatarFallback className="text-xs">{getInitials(user.displayName)}</AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${presence?.status === 'online' ? 'bg-green-500' : presence?.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'} rounded-full border-2 border-background transition-colors duration-200`}></div>
                    </div>
                    {!isCollapsed && (
                      <div className="flex-1 overflow-hidden ml-3 text-left">
                        <span className={`truncate block transition-all duration-200 ${
                          hasUnread && !isActive ? 'font-semibold' : 'font-medium'
                        }`}>
                          {user.displayName}
                        </span>
                        <p className={`text-xs truncate transition-all duration-200 ${
                          hasUnread && !isActive 
                            ? 'text-blue-700 dark:text-blue-300 font-medium' 
                            : 'text-muted-foreground'
                        }`}>
                          {hasUnread 
                            ? `${unreadCount} new message${unreadCount > 1 ? 's' : ''}` 
                            : presenceText
                          }
                        </p>
                      </div>
                    )}
                    {hasUnread && (
                      <div className={`bg-blue-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center ${
                        isCollapsed ? 'absolute -top-1 -right-1' : 'ml-auto'
                      }`}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </div>
                    )}
                  </Button>
                );
              })}
              </div>
            </div>
          ))}
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center text-muted-foreground py-8 px-2">
            <p className="text-sm">
              {searchQuery ? 'No users found' : 'No other users online'}
            </p>
          </div>
        )}
      </div>

      <div className="border-t p-2 space-y-1">
        {/* User Profile Section */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={`w-full justify-start h-auto p-2 hover:bg-muted ${isCollapsed ? 'px-2' : 'px-3'}`}
              title={isCollapsed ? user?.displayName : undefined}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage 
                  src={`https://api.dicebear.com/8.x/lorelei/svg?seed=${user?.displayName}`} 
                  alt={user?.displayName} 
                />
                <AvatarFallback className="text-xs">
                  {user?.displayName ? getInitials(user.displayName) : 'U'}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <span className="truncate ml-3">{user?.displayName || 'User'}</span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Bell className="mr-2 h-4 w-4" />
              <span>Notifications</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Shield className="mr-2 h-4 w-4" />
              <span>Privacy</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Settings with Theme Toggle */}
        <SettingsDropdown isCollapsed={isCollapsed} />

        {/* Logout */}
        <LogoutButton isCollapsed={isCollapsed} onLogout={logout} />
      </div>


    </div>
  );
};

export default UserSidebar;