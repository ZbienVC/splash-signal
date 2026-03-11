import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_USER: User = {
  username: 'GUEST_ANALYST',
  login: 'guest',
  email: 'guest@splashsignal.io',
  displayName: 'Guest Analyst',
  profilePicture: 'https://api.dicebear.com/7.x/identicon/svg?seed=guest',
  role: 'ANALYST',
  status: 'PUBLIC_ACCESS_ACTIVE',
  settings: {
    defaultLandingPage: 'home',
    timezone: 'UTC',
    units: 'USD',
    dataMode: 'light'
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(GUEST_USER);

  const login = async () => {};
  const signup = async () => {};
  const logout = () => {};

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
