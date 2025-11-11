import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Socket } from 'socket.io-client';
import axios from 'axios';

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
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (!socket || !open) return;

    const handleUsers = (users: User[]) => {
      const filteredUsers = users.filter(u => u.id !== currentUser?.id);
      setOnlineUsers(filteredUsers);
    };

    socket.on('users', handleUsers);

    return () => {
      socket.off('users', handleUsers);
    };
  }, [socket, currentUser, open]);

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
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:3000/groups',
        {
          name: groupName.trim(),
          memberIds: Array.from(selectedUserIds),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

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
              {onlineUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No online users available</p>
              ) : (
                <div className="space-y-3">
                  {onlineUsers.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={user.id}
                        checked={selectedUserIds.has(user.id)}
                        onCheckedChange={() => handleToggleUser(user.id)}
                      />
                      <label
                        htmlFor={user.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {user.displayName}
                      </label>
                    </div>
                  ))}
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
