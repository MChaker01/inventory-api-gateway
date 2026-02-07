import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { api } from "../api/axios";
import { AxiosError } from "axios";

// Types
// Define the User interface (username, role).
interface User {
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

// 2. Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Provider Component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start true to check localStorage
  const [error, setError] = useState<string | null>(null);

  // EFFECT: Check for token on refresh
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");

        if (token && savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error(error);
        localStorage.removeItem("token");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post("/auth/login", { username, password });

      const { token, user } = response.data; // Extract data

      // 1. Save Token (It's already a string)
      localStorage.setItem("token", token);

      // 2. Save User (It's an Object -> Convert to String)
      localStorage.setItem("user", JSON.stringify(user));

      // 3. Update State (React wants the Object, not the string)
      setUser(user);

      // Clear errors
      setError(null);
    } catch (err) {
      const error = err as AxiosError<{ message: string }>; // Type Casting
      console.error(error);
      // Try to get the specific error message from Backend
      setError(error.response?.data?.message || "Server Error during login");
      // Re-throw the error so Login.tsx can catch it
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, error }}>
      {" "}
      {children}
    </AuthContext.Provider>
  );
};

// 4. Hook
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be within an AuthProvider");
  }

  return context;
};
