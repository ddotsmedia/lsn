'use client';

import { useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated by looking for token
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      }
    }

    setLoading(false);
  }, []);

  const login = (userData: User, token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token);
      localStorage.setItem('user', JSON.stringify(userData));
    }
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
    setUser(null);
    setIsAuthenticated(false);
  };

  return {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
  };
}
