import { createContext, useContext, useMemo, useState } from "react";
import { authService } from "../services/authService";
import { tokenService } from "../services/tokenService";
import { usersService } from "../services/usersService";

const USER_KEY = "auth_user";
const ROLE_KEY = "auth_role";

const AuthContext = createContext(null);

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getStoredRole = () => localStorage.getItem(ROLE_KEY);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [role, setRole] = useState(getStoredRole());
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  const persistUser = (me) => {
    setUser(me);
    setRole(me?.role || null);
    localStorage.setItem(USER_KEY, JSON.stringify(me));
    localStorage.setItem(ROLE_KEY, me?.role || "");
  };

  const login = async (username, password) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      // authenticate and store tokens
      await authService.login({ username, password });
      // fetch user info (including role) from backend
      const me = await usersService.me();
      persistUser(me);
      setIsAuthenticated(true);
      return me; // return user object for caller
    } catch (error) {
      setAuthError(error?.response?.data || "Login failed");
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setRole(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ROLE_KEY);
  };

  const refreshToken = async () => {
    try {
      await authService.refreshToken();
      const me = await usersService.me();
      persistUser(me);
      setIsAuthenticated(Boolean(tokenService.getAccessToken()));
      return true;
    } catch {
      logout();
      return false;
    }
  };

  const value = useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      authError,
      user,
      role,
      login,
      logout,
      refreshToken,
    }),
    [isAuthenticated, isLoading, authError, user, role]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
