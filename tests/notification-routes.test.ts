import test from 'node:test';
import assert from 'node:assert/strict';
import { getNotificationActionPath } from '../features/notifications/formatter.ts';

test('builds a profile route for profile-based notifications', () => {
  assert.equal(
    getNotificationActionPath({ type: 'profile_view', targetUserId: 'user-123' }),
    '/profile/user-123',
  );
});

test('builds a message route for chat notifications', () => {
  assert.equal(
    getNotificationActionPath({ type: 'message', chatId: 'chat-42' }),
    '/messages/chat-42',
  );
});
