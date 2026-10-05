import { createContext, useContext, useEffect, useState } from 'react';
import { api, setAccessToken } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    api.refresh().then((data) => {
      setAccessToken(data.accessToken);
      return api.me().then((me) => setUser(me.user));
    }).catch(() => {}).finally(() => setReady(true));
  }, []);
  async function signIn(credentials) {
    const data = await api.login(credentials);
    setAccessToken(data.accessToken);
    setUser(data.user);
  }
  async function register(credentials) {
    const data = await api.register(credentials);
    setAccessToken(data.accessToken);
    setUser(data.user);
  }
  async function signOut() {
    await api.logout().catch(() => {});
    setAccessToken(null);
    setUser(null);
  }
  return <AuthContext.Provider value={{ user, ready, signIn, register, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
