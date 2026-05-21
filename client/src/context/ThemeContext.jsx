import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const ThemeContext = createContext();

// Helper to determine the initial theme synchronously before state effects run
const getInitialTheme = () => {
  try {
    const storedUserStr = localStorage.getItem('carms_user');
    if (storedUserStr) {
      const storedUser = JSON.parse(storedUserStr);
      if (storedUser && storedUser._id) {
        const userTheme = localStorage.getItem(`carms_theme_${storedUser._id}`);
        if (userTheme) return userTheme;
        if (storedUser.theme) return storedUser.theme;
      }
    }
  } catch (err) {
    console.error('Error reading stored user for theme initialization:', err);
  }
  return localStorage.getItem('carms_theme_guest') || 'dark';
};

export function ThemeProvider({ children }) {
  const { user, setUser } = useAuth();
  const [theme, setTheme] = useState(getInitialTheme);

  // Sync theme when user changes (e.g., login, logout, account switch)
  useEffect(() => {
    if (user && user._id) {
      const userTheme = user.theme || localStorage.getItem(`carms_theme_${user._id}`) || 'dark';
      setTheme(userTheme);
      localStorage.setItem(`carms_theme_${user._id}`, userTheme);
    } else {
      const guestTheme = localStorage.getItem('carms_theme_guest') || 'dark';
      setTheme(guestTheme);
    }
  }, [user?._id]);

  // Apply theme class to body and cache locally
  useEffect(() => {
    const root = window.document.body;
    if (theme === 'light') {
      root.classList.add('light-mode');
    } else {
      root.classList.remove('light-mode');
    }

    if (user && user._id) {
      localStorage.setItem(`carms_theme_${user._id}`, theme);
    } else {
      localStorage.setItem('carms_theme_guest', theme);
    }
  }, [theme, user?._id]);

  // Handle changing the theme (updates state, caches locally, updates auth user state, and syncs to DB)
  const changeTheme = async (newTheme) => {
    setTheme(newTheme);

    if (user && user._id) {
      // 1. Cache under user-specific key
      localStorage.setItem(`carms_theme_${user._id}`, newTheme);

      // 2. Synchronize AuthContext user state and local storage payload
      const updatedUser = { ...user, theme: newTheme };
      setUser(updatedUser);
      localStorage.setItem('carms_user', JSON.stringify(updatedUser));

      // 3. Send PUT request to persist to MongoDB
      try {
        await api.put('/users/profile', { theme: newTheme });
      } catch (err) {
        console.error('Failed to sync theme preference to database:', err);
      }
    } else {
      localStorage.setItem('carms_theme_guest', newTheme);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    changeTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: changeTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

