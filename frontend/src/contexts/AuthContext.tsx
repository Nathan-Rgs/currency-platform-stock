import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, LoginResponse, Token } from '@/lib/api';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any; // Simplified user object
  login: (username: string, password: string) => Promise<LoginResponse>;
  finishMfaLogin: (token: Token) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// A simple function to decode JWT and get user info
const parseJwt = (token: string) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};


export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsAuthenticated(true);
      setUser(parseJwt(token));
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const response = await authApi.login(username, password);
    if (response.token) {
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
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, finishMfaLogin, logout }}>
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
