import { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Initialize MMKV storage
const storage = new MMKV({
  id: 'oLo-AppStorage',
  encryptionKey: 'JDMCOOndskjsd&*Bdkfsd689OOIDHnc)(@#89',
});

// MMKV adapter for Zustand
const mmkvStorage = {
  getItem: (name: string): string | null => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string): void => {
    storage.set(name, value);
  },
  removeItem: (name: string): void => {
    storage.delete(name);
  },
};

export interface NavigationState {
  canGoBack: boolean;
  canGoForward: boolean;
  url: string;
  title: string;
  loading: boolean;
}

export interface AuthState {
  isLoggedIn: boolean;
  sessionCookies: string[];
  lastLoginTime: number;
  userEmail?: string;
  rememberCredentials: boolean;
  savedCredentials?: {
    email: string;
    encryptedPassword: string;
  };
}

export interface BrowserHistoryItem {
  url: string;
  title: string;
  timestamp: number;
  favicon?: string;
}

export interface BrowserState {
  currentUrl: string;
  navigationHistory: BrowserHistoryItem[];
  currentNavigationState: NavigationState;
  lastActiveUrl: string;
  auth: AuthState;
  settings: {
    clearDataOnAppClose: boolean;
    saveHistory: boolean;
    maxHistoryItems: number;
    autoLogin: boolean;
    sessionTimeout: number;
  };

  // Actions
  updateNavigationState: (state: NavigationState) => void;
  setCurrentUrl: (url: string) => void;
  addToHistory: (item: BrowserHistoryItem) => void;
  clearHistory: () => void;
  clearOldHistory: (maxAge: number) => void;

  // Auth actions
  login: (credentials: { email: string; password: string; rememberMe: boolean }) => void;
  logout: () => void;
  updateSessionCookies: (cookies: string[]) => void;
  isSessionValid: () => boolean;
  refreshSession: () => void;

  // Settings actions
  updateSettings: (settings: Partial<BrowserState['settings']>) => void;

  // Data management
  clearAllData: () => void;
}

const encryptPassword = (password: string): string => {
  return btoa(unescape(encodeURIComponent(password)));
};

const decryptPassword = (encryptedPassword: string): string => {
  try {
    return decodeURIComponent(escape(atob(encryptedPassword)));
  } catch {
    return '';
  }
};

const DEFAULT_SESSION_TIMEOUT = 24 * 60 * 60 * 1000;

export const useBrowserStore = create<BrowserState>()(
  persist(
    (set, get) => ({
      currentUrl: 'https://olo-care.com/en/dashboard',
      navigationHistory: [],
      currentNavigationState: {
        canGoBack: false,
        canGoForward: false,
        url: 'https://olo-care.com/en/dashboard',
        title: 'iScan - Eye Health',
        loading: true,
      },
      lastActiveUrl: 'https://olo-care.com/en/dashboard',

      auth: {
        isLoggedIn: false,
        sessionCookies: [],
        lastLoginTime: 0,
        rememberCredentials: false,
      },

      settings: {
        clearDataOnAppClose: false,
        saveHistory: true,
        maxHistoryItems: 100,
        autoLogin: true,
        sessionTimeout: DEFAULT_SESSION_TIMEOUT,
      },

      updateNavigationState: newState => {
        const state = get();

        if (
          newState.url === state.currentNavigationState.url &&
          newState.loading === state.currentNavigationState.loading
        ) {
          set({ currentNavigationState: newState });
          return;
        }

        const updates: Partial<BrowserState> = {
          currentNavigationState: newState,
          currentUrl: newState.url,
        };

        if (!newState.loading) {
          updates.lastActiveUrl = newState.url;
        }

        if (
          !newState.loading &&
          newState.url !== state.currentUrl &&
          state.settings.saveHistory &&
          newState.url.startsWith('http')
        ) {
          const historyItem: BrowserHistoryItem = {
            url: newState.url,
            title: newState.title,
            timestamp: Date.now(),
          };

          const filteredHistory = state.navigationHistory.filter(h => h.url !== newState.url);
          updates.navigationHistory = [historyItem, ...filteredHistory].slice(
            0,
            state.settings.maxHistoryItems
          );
        }

        set(updates);
      },

      setCurrentUrl: url => {
        set({ currentUrl: url, lastActiveUrl: url });
      },

      addToHistory: item => {
        const state = get();
        if (!state.settings.saveHistory) return;

        const filteredHistory = state.navigationHistory.filter(h => h.url !== item.url);
        const newHistory = [item, ...filteredHistory].slice(0, state.settings.maxHistoryItems);
        set({ navigationHistory: newHistory });
      },

      clearHistory: () => {
        set({ navigationHistory: [] });
      },

      clearOldHistory: maxAge => {
        const state = get();
        const cutoffTime = Date.now() - maxAge;
        const filteredHistory = state.navigationHistory.filter(item => item.timestamp > cutoffTime);
        set({ navigationHistory: filteredHistory });
      },

      login: credentials => {
        const newAuth: AuthState = {
          isLoggedIn: true,
          sessionCookies: [],
          lastLoginTime: Date.now(),
          userEmail: credentials.email,
          rememberCredentials: credentials.rememberMe,
        };

        if (credentials.rememberMe && credentials.password) {
          newAuth.savedCredentials = {
            email: credentials.email,
            encryptedPassword: encryptPassword(credentials.password),
          };
        }

        set({ auth: newAuth });
      },

      logout: () => {
        const state = get();
        set({
          auth: {
            ...state.auth,
            isLoggedIn: false,
            sessionCookies: [],
            userEmail: undefined,
            lastLoginTime: 0,
          },
        });
      },

      updateSessionCookies: cookies => {
        const state = get();
        if (JSON.stringify(state.auth.sessionCookies) !== JSON.stringify(cookies)) {
          set({
            auth: {
              ...state.auth,
              sessionCookies: cookies,
            },
          });
        }
      },

      isSessionValid: () => {
        const { auth, settings } = get();
        if (!auth.isLoggedIn) return false;
        const sessionAge = Date.now() - auth.lastLoginTime;
        return sessionAge < settings.sessionTimeout;
      },

      refreshSession: () => {
        const state = get();
        if (state.auth.isLoggedIn) {
          set({
            auth: {
              ...state.auth,
              lastLoginTime: Date.now(),
            },
          });
        }
      },

      updateSettings: newSettings => {
        const state = get();
        set({
          settings: { ...state.settings, ...newSettings },
        });
      },

      clearAllData: () => {
        set({
          currentUrl: 'https://olo-care.com/en/dashboard',
          navigationHistory: [],
          currentNavigationState: {
            canGoBack: false,
            canGoForward: false,
            url: 'https://olo-care.com/en/dashboard',
            title: 'iScan - Eye Health',
            loading: true,
          },
          lastActiveUrl: 'https://olo-care.com/en/dashboard',
          auth: {
            isLoggedIn: false,
            sessionCookies: [],
            lastLoginTime: 0,
            rememberCredentials: false,
          },
          settings: {
            clearDataOnAppClose: false,
            saveHistory: true,
            maxHistoryItems: 100,
            autoLogin: true,
            sessionTimeout: DEFAULT_SESSION_TIMEOUT,
          },
        });
      },
    }),
    {
      name: 'browser-state',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: state => ({
        currentUrl: state.currentUrl,
        lastActiveUrl: state.lastActiveUrl,
        navigationHistory: state.navigationHistory,
        auth: state.auth,
        settings: state.settings,
      }),
    }
  )
);

// Stable hook for credentials
export const useSavedCredentials = () => {
  const auth = useBrowserStore(state => state.auth);
  const hasCredentials = !!auth.savedCredentials && auth.rememberCredentials;

  return {
    getSavedCredentials: () => {
      if (auth.savedCredentials && auth.rememberCredentials) {
        return {
          email: auth.savedCredentials.email,
          password: decryptPassword(auth.savedCredentials.encryptedPassword),
        };
      }
      return null;
    },
    hasCredentials,
  };
};

// Stable hook for session management
export const useSessionManager = () => {
  const isLoggedIn = useBrowserStore(state => state.auth.isLoggedIn);
  const sessionCookies = useBrowserStore(state => state.auth.sessionCookies);

  return {
    isLoggedIn,
    sessionCookies,
    checkAndRenewSession: () => {
      const store = useBrowserStore.getState();
      if (!store.isSessionValid()) {
        store.logout();
        return false;
      }
      store.refreshSession();
      return true;
    },
    applySavedCookies: (webViewRef: any) => {
      const cookies = useBrowserStore.getState().auth.sessionCookies;
      if (cookies.length > 0) {
        const cookieScript = cookies
          .map(cookie => `document.cookie = "${cookie.replace(/"/g, '\\"')}";`)
          .join('\n');

        webViewRef.current?.injectJavaScript(`
          (function() {
            ${cookieScript}
            return true;
          })();
        `);
      }
    },
  };
};

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  hasSeenWelcome: boolean;
  firstLaunchTimestamp: number | null;
  completeOnboarding: () => void;
  completeWelcome: () => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    set => ({
      hasCompletedOnboarding: false,
      hasSeenWelcome: false,
      firstLaunchTimestamp: null,

      completeOnboarding: () =>
        set({
          hasCompletedOnboarding: true,
          firstLaunchTimestamp: Date.now(),
        }),

      completeWelcome: () =>
        set({
          hasSeenWelcome: true,
        }),

      reset: () =>
        set({
          hasCompletedOnboarding: false,
          hasSeenWelcome: false,
          firstLaunchTimestamp: null,
        }),
    }),
    {
      name: 'onboarding-state',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
