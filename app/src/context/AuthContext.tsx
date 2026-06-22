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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, setToken, clearToken } from '../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  profileComplete?: boolean;
}

interface AuthContextValue {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  isNewSignup: boolean;
  pendingTerms: { token: string; userData: User } | null;
  login: (token: string, user: User, isSignup?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (fields: Partial<User>) => void;
  clearNewSignup: () => void;
  clearPendingTerms: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  isLoading: true,
  isAuthenticated: false,
  user: null,
  isNewSignup: false,
  pendingTerms: null,
  login: async () => {},
  logout: async () => {},
  updateUser: () => {},
  clearNewSignup: () => {},
  clearPendingTerms: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isNewSignup, setIsNewSignup] = useState(false);
  const [pendingTerms, setPendingTerms] = useState<{ token: string; userData: User } | null>(null);

  // Bootstrap — runs once on app launch
  useEffect(() => {
    const bootstrap = async () => {
      try {
        // Check if there is a pending terms acceptance session in local storage first
        const pending = await AsyncStorage.getItem('@pending_terms');
        if (pending) {
          const parsed = JSON.parse(pending);
          setPendingTerms(parsed);
          setIsLoading(false);
          return;
        }

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

  const login = useCallback(async (token: string, userData: User, isSignup: boolean = false) => {
    await AsyncStorage.removeItem('@pending_terms');
    setPendingTerms(null);
    await setToken(token);
    setUser(userData);
    setIsNewSignup(isSignup);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem('@pending_terms');
    setPendingTerms(null);
    await clearToken();
    setUser(null);
    setIsNewSignup(false);
    setIsAuthenticated(false);
  }, []);

  const updateUser = useCallback((fields: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...fields } : null));
  }, []);

  const clearNewSignup = useCallback(() => {
    setIsNewSignup(false);
  }, []);

  const clearPendingTerms = useCallback(async () => {
    await AsyncStorage.removeItem('@pending_terms');
    setPendingTerms(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isLoading, isAuthenticated, user, isNewSignup, pendingTerms, login, logout, updateUser, clearNewSignup, clearPendingTerms }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
