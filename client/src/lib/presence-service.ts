// @ts-ignore - date-fns import issue
import { formatDistanceToNow } from 'date-fns';

export type PresenceStatus = 'online' | 'away' | 'offline';

export interface UserPresence {
  userId: string;
  status: PresenceStatus;
  lastSeen: Date | null;
  isTyping: boolean;
}

export interface PresenceUpdate {
  userId: string;
  status: PresenceStatus;
  lastSeen?: string;
}

class PresenceService {
  private presenceMap = new Map<string, UserPresence>();
  private listeners = new Set<(presence: Map<string, UserPresence>) => void>();
  private typingTimeouts = new Map<string, NodeJS.Timeout>();

  constructor() {
    // Auto-cleanup old presence data
    setInterval(() => this.cleanupOldPresence(), 60000); // Every minute
  }

  public subscribe(listener: (presence: Map<string, UserPresence>) => void) {
    this.listeners.add(listener);
    // Immediately call with current state
    listener(new Map(this.presenceMap));
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(new Map(this.presenceMap)));
  }

  public updatePresence(update: PresenceUpdate) {
    const existing = this.presenceMap.get(update.userId);
    const lastSeen = update.lastSeen ? new Date(update.lastSeen) : existing?.lastSeen || new Date();
    
    const presence: UserPresence = {
      userId: update.userId,
      status: update.status,
      lastSeen,
      isTyping: existing?.isTyping || false,
    };

    this.presenceMap.set(update.userId, presence);
    this.notifyListeners();
  }

  public setTyping(userId: string, isTyping: boolean) {
    const existing = this.presenceMap.get(userId);
    if (!existing) return;

    // Clear existing timeout
    const existingTimeout = this.typingTimeouts.get(userId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.typingTimeouts.delete(userId);
    }

    // Update typing status
    const updated: UserPresence = {
      ...existing,
      isTyping,
    };

    this.presenceMap.set(userId, updated);
    this.notifyListeners();

    // Auto-clear typing after 3 seconds if no update
    if (isTyping) {
      const timeout = setTimeout(() => {
        this.setTyping(userId, false);
      }, 3000);
      this.typingTimeouts.set(userId, timeout);
    }
  }

  public getUserPresence(userId: string): UserPresence | null {
    return this.presenceMap.get(userId) || null;
  }

  public getAllPresence(): Map<string, UserPresence> {
    return new Map(this.presenceMap);
  }

  public removeUser(userId: string) {
    this.presenceMap.delete(userId);
    const timeout = this.typingTimeouts.get(userId);
    if (timeout) {
      clearTimeout(timeout);
      this.typingTimeouts.delete(userId);
    }
    this.notifyListeners();
  }

  private cleanupOldPresence() {
    const now = new Date();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [userId, presence] of this.presenceMap.entries()) {
      if (presence.status === 'offline' && presence.lastSeen) {
        const timeSinceLastSeen = now.getTime() - presence.lastSeen.getTime();
        if (timeSinceLastSeen > staleThreshold) {
          this.presenceMap.delete(userId);
        }
      }
    }
    this.notifyListeners();
  }

  public getPresenceColor(status: PresenceStatus): string {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  }

  public getPresenceText(presence: UserPresence | null): string {
    if (!presence) return 'Unknown';

    switch (presence.status) {
      case 'online':
        return 'Online';
      case 'away':
        return 'Away';
      case 'offline':
        if (presence.lastSeen) {
          return `Last seen ${formatDistanceToNow(presence.lastSeen, { addSuffix: true })}`;
        }
        return 'Offline';
      default:
        return 'Unknown';
    }
  }

  public getStatusPriority(status: PresenceStatus): number {
    switch (status) {
      case 'online': return 3;
      case 'away': return 2;
      case 'offline': return 1;
      default: return 0;
    }
  }

  public sortUsersByPresence<T extends { id: string }>(
    users: T[], 
    getPresence: (userId: string) => UserPresence | null = (id) => this.getUserPresence(id)
  ): T[] {
    return [...users].sort((a, b) => {
      const aPresence = getPresence(a.id);
      const bPresence = getPresence(b.id);
      
      const aPriority = aPresence ? this.getStatusPriority(aPresence.status) : 0;
      const bPriority = bPresence ? this.getStatusPriority(bPresence.status) : 0;
      
      // Sort by presence priority (online first), then by name
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return a.id.localeCompare(b.id);
    });
  }
}

// Create singleton instance
export const presenceService = new PresenceService();