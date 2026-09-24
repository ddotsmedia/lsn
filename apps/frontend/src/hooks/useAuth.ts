'use client';

import { useEffect, useState } from 'react';

// Note: This is a simplified auth check hook
// For full user data and auth context, use useAuth from lib/auth-context
// This hook specifically checks for token presence in localStorage

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated by looking for token
    // Using 'lsn_token' key as per backend API expectations
    const token = typeof window !== 'undefined' ? localStorage.getItem('lsn_token') : null;

    if (token) {
      setIsAuthenticated(true);
    }

    setLoading(false);
  }, []);

  const login = (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lsn_token', token);
    }
    setIsAuthenticated(true);
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lsn_token');
      localStorage.removeItem('lsn_refresh');
    }
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    loading,
    login,
    logout,
  };
}
