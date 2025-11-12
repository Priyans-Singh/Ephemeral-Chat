import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Socket } from 'socket.io-client';
import { apiClient } from '@/lib/api';

interface User {
  id: string;
  displayName: string;
}

interface CreateGroupModalProps {
  children: React.ReactNode;
  onGroupCreated: () => void;
  socket: Socket | null;
}

export function CreateGroupModal({ children, onGroupCreated, socket }: CreateGroupModalProps) {
  const [open, setOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user: currentUser } = useAuth();

  // Fetch all users (minus the current user) whenever the dialog opens
  useEffect(() => {
    let isMounted = true;

    if (!open) {
      return;
    }

    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      setUsersError(null);
      try {
        const response = await apiClient.get<User[]>('/users');
        if (!isMounted) return;
        setAvailableUsers(response.data);
      } catch (error) {
        console.error('Failed to load users for group creation:', error);
        if (isMounted) {
          setUsersError('Failed to load users. Please try again.');
          setAvailableUsers([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingUsers(false);
        }
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, [open]);

  // Track online status to highlight currently active users
  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleUsers = (users: User[]) => {
      setOnlineUserIds(new Set(users.map((user) => user.id)));
    };

    socket.on('users', handleUsers);
    socket.emit('requestUsers');

    return () => {
      socket.off('users', handleUsers);
    };
  }, [socket]);

  const handleToggleUser = (userId: string) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupName.trim() || selectedUserIds.size === 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.post('/groups', {
        name: groupName.trim(),
        memberIds: Array.from(selectedUserIds),
      });

      setGroupName('');
      setSelectedUserIds(new Set());
      setOpen(false);
      onGroupCreated();
    } catch (error) {
      console.error('Failed to create group:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              required
            />
          </div>
          <div>
            <Label>Select Members</Label>
            <ScrollArea className="h-[200px] border rounded-md p-4 mt-2">
              {isLoadingUsers ? (
                <p className="text-sm text-muted-foreground">Loading users...</p>
              ) : usersError ? (
                <p className="text-sm text-destructive">{usersError}</p>
              ) : availableUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No users found</p>
              ) : (
                <div className="space-y-3">
                  {availableUsers.map((user) => {
                    const isOnline = onlineUserIds.has(user.id);
                    return (
                      <div key={user.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={user.id}
                          checked={selectedUserIds.has(user.id)}
                          onCheckedChange={() => handleToggleUser(user.id)}
                        />
                        <label
                          htmlFor={user.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1 flex justify-between items-center"
                        >
                          <span>{user.displayName}</span>
                          <span
                            className={`text-xs ${isOnline ? 'text-green-600' : 'text-muted-foreground'}`}
                          >
                            {isOnline ? 'Online' : 'Offline'}
                          </span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !groupName.trim() || selectedUserIds.size === 0}>
              {isSubmitting ? 'Creating...' : 'Create Group'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
