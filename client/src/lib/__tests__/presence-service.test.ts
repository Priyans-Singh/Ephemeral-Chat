import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { presenceService, type PresenceUpdate } from '../presence-service';

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn((date) => '2 minutes ago'),
}));

describe('PresenceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear any existing presence data
    presenceService.getAllPresence().clear();
  });

  afterEach(() => {
    // Clean up any timeouts
    vi.clearAllTimers();
  });

  describe('presence updates', () => {
    it('should update user presence', () => {
      const update: PresenceUpdate = {
        userId: 'user1',
        status: 'online',
        lastSeen: new Date().toISOString(),
      };

      presenceService.updatePresence(update);
      const presence = presenceService.getUserPresence('user1');

      expect(presence).toBeTruthy();
      expect(presence?.status).toBe('online');
      expect(presence?.userId).toBe('user1');
      expect(presence?.isTyping).toBe(false);
    });

    it('should preserve existing typing status when updating presence', () => {
      // First set typing status
      presenceService.updatePresence({ userId: 'user1', status: 'online' });
      presenceService.setTyping('user1', true);

      // Then update presence
      presenceService.updatePresence({ userId: 'user1', status: 'away' });
      const presence = presenceService.getUserPresence('user1');

      expect(presence?.status).toBe('away');
      expect(presence?.isTyping).toBe(true);
    });

    it('should handle presence update without lastSeen', () => {
      presenceService.updatePresence({ userId: 'user1', status: 'online' });
      const presence = presenceService.getUserPresence('user1');

      expect(presence?.lastSeen).toBeInstanceOf(Date);
    });
  });

  describe('typing indicators', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      presenceService.updatePresence({ userId: 'user1', status: 'online' });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should set typing status', () => {
      presenceService.setTyping('user1', true);
      const presence = presenceService.getUserPresence('user1');

      expect(presence?.isTyping).toBe(true);
    });

    it('should clear typing status', () => {
      presenceService.setTyping('user1', true);
      presenceService.setTyping('user1', false);
      const presence = presenceService.getUserPresence('user1');

      expect(presence?.isTyping).toBe(false);
    });

    it('should auto-clear typing after timeout', () => {
      presenceService.setTyping('user1', true);
      
      // Fast-forward time
      vi.advanceTimersByTime(3000);
      
      const presence = presenceService.getUserPresence('user1');
      expect(presence?.isTyping).toBe(false);
    });

    it('should handle typing for non-existent user', () => {
      // Should not throw
      presenceService.setTyping('nonexistent', true);
      const presence = presenceService.getUserPresence('nonexistent');
      expect(presence).toBeNull();
    });

    it('should clear existing timeout when setting new typing status', () => {
      presenceService.setTyping('user1', true);
      presenceService.setTyping('user1', true); // Set again
      
      // Should not have multiple timeouts
      vi.advanceTimersByTime(3000);
      const presence = presenceService.getUserPresence('user1');
      expect(presence?.isTyping).toBe(false);
    });
  });

  describe('user management', () => {
    it('should remove user presence', () => {
      presenceService.updatePresence({ userId: 'user1', status: 'online' });
      presenceService.setTyping('user1', true);
      
      presenceService.removeUser('user1');
      
      const presence = presenceService.getUserPresence('user1');
      expect(presence).toBeNull();
    });

    it('should get all presence data', () => {
      presenceService.updatePresence({ userId: 'user1', status: 'online' });
      presenceService.updatePresence({ userId: 'user2', status: 'away' });
      
      const allPresence = presenceService.getAllPresence();
      
      expect(allPresence.size).toBe(2);
      expect(allPresence.has('user1')).toBe(true);
      expect(allPresence.has('user2')).toBe(true);
    });
  });

  describe('subscription system', () => {
    it('should notify subscribers on presence updates', () => {
      const listener = vi.fn();
      
      const unsubscribe = presenceService.subscribe(listener);
      
      // Should be called immediately with current state
      expect(listener).toHaveBeenCalledTimes(1);
      
      presenceService.updatePresence({ userId: 'user1', status: 'online' });
      
      // Should be called again after update
      expect(listener).toHaveBeenCalledTimes(2);
      
      unsubscribe();
    });

    it('should notify subscribers on typing changes', () => {
      const listener = vi.fn();
      
      presenceService.updatePresence({ userId: 'user1', status: 'online' });
      presenceService.subscribe(listener);
      
      presenceService.setTyping('user1', true);
      
      expect(listener).toHaveBeenCalledWith(expect.any(Map));
      const lastCall = listener.mock.calls[listener.mock.calls.length - 1][0];
      expect(lastCall.get('user1')?.isTyping).toBe(true);
    });

    it('should unsubscribe listeners', () => {
      const listener = vi.fn();
      
      const unsubscribe = presenceService.subscribe(listener);
      unsubscribe();
      
      presenceService.updatePresence({ userId: 'user1', status: 'online' });
      
      // Should only be called once (initial call)
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('utility methods', () => {
    it('should get presence colors', () => {
      expect(presenceService.getPresenceColor('online')).toBe('bg-green-500');
      expect(presenceService.getPresenceColor('away')).toBe('bg-yellow-500');
      expect(presenceService.getPresenceColor('offline')).toBe('bg-gray-400');
    });

    it('should get presence text', () => {
      const onlinePresence = { userId: 'user1', status: 'online' as const, lastSeen: null, isTyping: false };
      const awayPresence = { userId: 'user2', status: 'away' as const, lastSeen: null, isTyping: false };
      const offlinePresence = { userId: 'user3', status: 'offline' as const, lastSeen: new Date(), isTyping: false };
      
      expect(presenceService.getPresenceText(onlinePresence)).toBe('Online');
      expect(presenceService.getPresenceText(awayPresence)).toBe('Away');
      expect(presenceService.getPresenceText(offlinePresence)).toBe('Last seen 2 minutes ago');
      expect(presenceService.getPresenceText(null)).toBe('Unknown');
    });

    it('should get status priority', () => {
      expect(presenceService.getStatusPriority('online')).toBe(3);
      expect(presenceService.getStatusPriority('away')).toBe(2);
      expect(presenceService.getStatusPriority('offline')).toBe(1);
    });

    it('should sort users by presence', () => {
      const users = [
        { id: 'user1', name: 'Alice' },
        { id: 'user2', name: 'Bob' },
        { id: 'user3', name: 'Charlie' },
      ];

      // Set up different presence statuses
      presenceService.updatePresence({ userId: 'user1', status: 'offline' });
      presenceService.updatePresence({ userId: 'user2', status: 'online' });
      presenceService.updatePresence({ userId: 'user3', status: 'away' });

      const sorted = presenceService.sortUsersByPresence(users);

      // Should be sorted: online, away, offline
      expect(sorted[0].id).toBe('user2'); // online
      expect(sorted[1].id).toBe('user3'); // away
      expect(sorted[2].id).toBe('user1'); // offline
    });

    it('should sort users with no presence data', () => {
      const users = [
        { id: 'user1', name: 'Alice' },
        { id: 'user2', name: 'Bob' },
      ];

      const sorted = presenceService.sortUsersByPresence(users);

      // Should maintain original order when no presence data
      expect(sorted).toEqual(users);
    });
  });
});