const TAB_ID_STORAGE_KEY = 'flashchat-tab-id';
const LEGACY_TOKEN_KEY = 'token';
const TOKEN_PREFIX = 'flashchat-token:';

const isBrowser = typeof window !== 'undefined';

const generateTabId = () => {
  if (!isBrowser) {
    return 'ssr-tab';
  }

  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const ensureTabId = (): string => {
  if (!isBrowser) {
    return 'ssr-tab';
  }

  const existing = window.sessionStorage.getItem(TAB_ID_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const newId = generateTabId();
  window.sessionStorage.setItem(TAB_ID_STORAGE_KEY, newId);
  return newId;
};

const getTokenStorageKey = () => `${TOKEN_PREFIX}${ensureTabId()}`;

const migrateLegacyTokenIfNeeded = (tokenKey: string): string | null => {
  if (!isBrowser) {
    return null;
  }

  const legacyToken = window.localStorage.getItem(LEGACY_TOKEN_KEY);
  if (!legacyToken) {
    return null;
  }

  window.localStorage.setItem(tokenKey, legacyToken);
  window.localStorage.removeItem(LEGACY_TOKEN_KEY);
  return legacyToken;
};

const getToken = (): string | null => {
  if (!isBrowser) {
    return null;
  }

  const tokenKey = getTokenStorageKey();
  const token = window.localStorage.getItem(tokenKey);
  if (token) {
    return token;
  }

  return migrateLegacyTokenIfNeeded(tokenKey);
};

const setToken = (value: string | null): void => {
  if (!isBrowser) {
    return;
  }

  const tokenKey = getTokenStorageKey();
  if (!value) {
    window.localStorage.removeItem(tokenKey);
    return;
  }
  window.localStorage.setItem(tokenKey, value);
};

export const tabSession = {
  getTabId: ensureTabId,
  getTokenKey: getTokenStorageKey,
  getToken,
  setToken,
};
