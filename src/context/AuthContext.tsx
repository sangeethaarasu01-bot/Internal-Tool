import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { type User, type AuthContextType } from "../types";

// Mock users for internal tool
const MOCK_USERS: User[] = [
  {
    id: "1",
    name: "Sangeetha",
    email: "sangeetha@gmail.com",
    role: "admin",
  },
  {
    id: "2",
    name: "Rajesh",
    email: "rajesh@gmail.com",
    role: "user",
  },
  {
    id: "3",
    name: "Priya",
    email: "priya@gmail.com",
    role: "user",
  },
];

// Mock credentials (In real app, use backend API)
const MOCK_CREDENTIALS = {
  "sangeetha@gmail.com": "password123",
  "rajesh@gmail.com": "password123",
  "priya@gmail.com": "password123",
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved session
    const savedUser = localStorage.getItem("ieee_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("ieee_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Validate credentials
    const expectedPassword =
      MOCK_CREDENTIALS[email as keyof typeof MOCK_CREDENTIALS];
    if (!expectedPassword || expectedPassword !== password) {
      setIsLoading(false);
      return false;
    }

    // Find user
    const foundUser = MOCK_USERS.find((u) => u.email === email);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem("ieee_user", JSON.stringify(foundUser));
      setIsLoading(false);
      return true;
    }

    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("ieee_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
