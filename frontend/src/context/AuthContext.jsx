import { createContext, useContext, useEffect, useState } from 'react';
import * as api from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem(api.TOKEN_KEY)) {
      setLoading(false);
      return;
    }
    api
      .fetchMe()
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem(api.TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const saveSession = (data) => {
    localStorage.setItem(api.TOKEN_KEY, data.token);
    setUser(data.user);
  };

  const login = async (email, password) => saveSession(await api.login({ email, password }));
  const register = async (name, email, password) =>
    saveSession(await api.register({ name, email, password }));
  const logout = () => {
    localStorage.removeItem(api.TOKEN_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}