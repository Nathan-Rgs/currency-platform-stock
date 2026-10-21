import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, LoginResponse, Token } from '@/lib/api';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any; // Simplified user object
  login: (username: string, password: string) => Promise<LoginResponse>;
  finishMfaLogin: (token: Token) => void;
  logout: () => void;
  checkAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// A simple function to decode JWT and get user info
const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    const paddedBase64 = pad ? base64 + '='.repeat(4 - pad) : base64;
    const jsonPayload = decodeURIComponent(atob(paddedBase64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

const isTokenValid = (token: string | null) => {
  if (!token) return false;
  const decoded = parseJwt(token);
  if (!decoded || !decoded.exp) return false;
  
  // exp is in seconds, Date.now() is in milliseconds
  return decoded.exp * 1000 > Date.now();
};


export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = () => {
    const token = localStorage.getItem('access_token');
    if (token && isTokenValid(token)) {
      setIsAuthenticated(true);
      setUser(parseJwt(token));
    } else {
      if (token) {
        localStorage.removeItem('access_token');
      }
      setIsAuthenticated(false);
      setUser(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    checkAuth();

    // Periodically check token validity every minute
    const interval = setInterval(checkAuth, 60000);
    return () => clearInterval(interval);
  }, []);

  const login = async (username: string, password: string) => {
    const response = await authApi.login(username, password);
    if (response.token && !response.mfa_required) {
      localStorage.setItem('access_token', response.token.access_token);
      setIsAuthenticated(true);
      setUser(parseJwt(response.token.access_token));
    }
    // Return the full response so the UI can check for mfa_required
    return response;
  };

  const finishMfaLogin = (token: Token) => {
    localStorage.setItem('access_token', token.access_token);
    setIsAuthenticated(true);
    setUser(parseJwt(token.access_token));
  };


  const logout = () => {
    localStorage.removeItem('access_token');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, finishMfaLogin, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
