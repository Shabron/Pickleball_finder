/**
 * AuthContext — Global authentication state
 *
 * On mount:
 *   1. Read the stored token from AsyncStorage
 *   2. Call GET /api/auth/me to verify it's still valid
 *   3. If valid → set authenticated = true (skip login)
 *   4. If missing / expired → clear token, go to Welcome
 *
 * Exposes:
 *   - isLoading     : true while the bootstrap check is running
 *   - isAuthenticated: true once a valid token is confirmed
 *   - user          : basic user object { _id, name, email }
 *   - login(token, user) : called after successful login / signup
 *   - logout()       : clears token + resets state
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, setToken, clearToken } from '../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
}

interface AuthContextValue {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  isLoading: true,
  isAuthenticated: false,
  user: null,
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Bootstrap — runs once on app launch
  useEffect(() => {
    const bootstrap = async () => {
      try {
        // Attempt to validate the stored token by calling /auth/me
        const res = await authApi.getMe();
        if (res.success && res.data) {
          setUser(res.data);
          setIsAuthenticated(true);
        } else {
          await clearToken();
        }
      } catch {
        // Token missing, expired, or invalid — clear it silently
        await clearToken();
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, []);

  const login = useCallback(async (token: string, userData: User) => {
    await setToken(token);
    setUser(userData);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    await clearToken();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isLoading, isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
