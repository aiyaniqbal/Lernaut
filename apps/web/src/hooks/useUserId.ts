/**
 * useUserId — stable browser-scoped user identity.
 *
 * On first visit/signup, a UUID is generated and stored in localStorage.
 * This UUID is used as the user's ID in all DB operations, giving each
 * browser/device its own independent progress record without requiring
 * a full auth system.
 *
 * Usage:
 *   const userId = useUserId();
 *   const userId = useUserId('My Display Name'); // updates displayName in DB
 */

import { useEffect, useState } from 'react';
import { ensureUser } from '@/app/actions/progression';

const USER_ID_KEY = 'lernaut_user_id';
const LEGACY_USER_ID_KEY = 'gamify_user_id';
const USER_NAME_KEY = 'lernaut_display_name';
const LEGACY_USER_NAME_KEY = 'gamify_display_name';

export function useUserId(displayName?: string): string | null {
  const [userId, setUserId] = useState<string | null>(() => getUserIdSync());

  useEffect(() => {
    const id = getUserIdSync();
    if (!id) return;

    // Store display name if provided
    if (displayName) {
      localStorage.setItem(USER_NAME_KEY, displayName);
    }

    const storedName =
      displayName ||
      localStorage.getItem(USER_NAME_KEY) ||
      localStorage.getItem(LEGACY_USER_NAME_KEY) ||
      'Learner';

    // Ensure authenticated user exists in DB
    ensureUser(id, storedName).catch(() => {});

    setUserId((prev) => (prev !== id ? id : prev));
  }, [displayName]);

  return userId;
}

/** Synchronous read of userId — safe only after mount */
export function getUserIdSync(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const authUserStr = localStorage.getItem('lernaut_auth_user');
    if (authUserStr) {
      const parsed = JSON.parse(authUserStr);
      if (parsed?.learnerId) {
        return parsed.learnerId;
      }
    }
  } catch {}

  const id = localStorage.getItem(USER_ID_KEY) || localStorage.getItem(LEGACY_USER_ID_KEY);
  return id || null;
}

/** Set display name and persist */
export function setDisplayName(name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_NAME_KEY, name);
  const userId = getUserIdSync();
  if (userId) {
    ensureUser(userId, name).catch(() => {});
  }
}
