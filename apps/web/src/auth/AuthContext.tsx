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
          JSON.stringify({ token: session.token, user: freshUser }),
        );
      } catch {
        if (!active) {
          return;
        }

        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
        setUser(null);
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

  function logout() {
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
