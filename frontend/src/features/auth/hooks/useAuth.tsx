import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { User } from "../types";
import { loginApi, logoutApi, fetchUserProfile } from "../api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("knmp_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("knmp_token");
    if (token) {
      fetchUserProfile()
        .then((profile) => {
          setUser(profile);
          localStorage.setItem("knmp_user", JSON.stringify(profile));
        })
        .catch(() => {
          localStorage.removeItem("knmp_token");
          localStorage.removeItem("knmp_user");
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await loginApi(email, password);
      localStorage.setItem("knmp_token", res.token);
      localStorage.setItem("knmp_user", JSON.stringify(res.user));
      setUser(res.user);
      navigate("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // ignore
    }
    localStorage.removeItem("knmp_token");
    localStorage.removeItem("knmp_user");
    setUser(null);
    navigate("/login");
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    const isSuper = user.roles?.some(
      (r) =>
        r.toLowerCase() === "superadmin" ||
        r.toLowerCase() === "super admin" ||
        r.toLowerCase() === "admin_ppk" ||
        r.toLowerCase() === "admin"
    );
    if (isSuper) return true;
    return user.permissions?.includes(permission) || false;
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    const isSuper = user.roles?.some(
      (r) => r.toLowerCase() === "superadmin" || r.toLowerCase() === "super admin"
    );
    if (isSuper) return true;
    return user.roles?.some((r) => r.toLowerCase() === role.toLowerCase()) || false;
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasPermission, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
