import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AuthResponse,
  AuthUser,
  LoginPayload,
  RegisterPayload,
  fetchCurrentUser,
  login as loginRequest,
  logoutSession,
  refreshSession,
  register as registerRequest,
} from '../lib/api';

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isReady: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
};

type StoredSession = {
  token: string;
  refreshToken: string;
  user: AuthUser;
};

const STORAGE_KEY = 'uevent.auth';

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredSession(): StoredSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function persistSession(payload: AuthResponse) {
  const session: StoredSession = {
    token: payload.accessToken,
    refreshToken: payload.refreshToken,
    user: payload.user,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;
    const stored = readStoredSession();

    if (!stored) {
      setIsReady(true);
      return;
    }

    setToken(stored.token);
    setUser(stored.user);
    const session = stored;

    async function syncUser() {
      try {
        const freshUser = await fetchCurrentUser(session.token);

        if (!active) {
          return;
        }

        setUser(freshUser);
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            token: session.token,
            refreshToken: session.refreshToken,
            user: freshUser,
          }),
        );
      } catch {
        try {
          const refreshedSession = await refreshSession({
            refreshToken: session.refreshToken,
          });

          if (!active) {
            return;
          }

          const persistedSession = persistSession(refreshedSession);
          setToken(persistedSession.token);
          setUser(persistedSession.user);
        } catch {
          if (!active) {
            return;
          }

          localStorage.removeItem(STORAGE_KEY);
          setToken(null);
          setUser(null);
        }
      } finally {
        if (active) {
          setIsReady(true);
        }
      }
    }

    void syncUser();

    return () => {
      active = false;
    };
  }, []);

  async function handleAuthResponse(request: Promise<AuthResponse>) {
    const payload = await request;
    const session = persistSession(payload);

    setToken(session.token);
    setUser(session.user);
  }

  async function logout() {
    const stored = readStoredSession();

    if (stored?.refreshToken) {
      try {
        await logoutSession({ refreshToken: stored.refreshToken });
      } catch {
        // We still clear the local session even if the server-side logout fails.
      }
    }

    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isReady,
      login: (payload) => handleAuthResponse(loginRequest(payload)),
      register: (payload) => handleAuthResponse(registerRequest(payload)),
      logout,
    }),
    [isReady, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return value;
}
