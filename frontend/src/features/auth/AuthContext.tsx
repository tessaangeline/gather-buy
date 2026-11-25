
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  login as loginUser,
  logout as logoutUser,
  getCurrentUser,
  type User,
} from "./authService";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  updateWalletBalance: (balance: number | string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore the user's session when the application starts
  useEffect(() => {
    getCurrentUser()
      .then((currentUser) => {
        setUser(currentUser);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Login
  const login = async (email: string, password: string) => {
    await loginUser({ email, password });

    const currentUser = await getCurrentUser();
    setUser(currentUser);

    return currentUser;
  };

  // Logout
  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  // Update wallet balance in the authenticated user's state
  const updateWalletBalance = (balance: number | string) => {
    setUser((previousUser) =>
      previousUser
        ? { ...previousUser, wallet_balance: balance }
        : null
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateWalletBalance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to access authentication state
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
