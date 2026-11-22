
import api from "../../services/api";

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: "SUPER_ADMIN" | "APARTMENT_ADMIN" | "SUPPLIER" | "RESIDENT";
  is_active: boolean;
  community_id: number | null;
  flat_number: string | null;
}

interface LoginCredentials {
  email: string;
  password: string;
}

export const login = async (credentials: LoginCredentials) => {
  const response = await api.post("/auth/login", credentials);
  return response.data;
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get("/auth/me");
  return response.data;
};

export const logout = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};

export const refreshSession = async () => {
  const response = await api.post("/auth/refresh");
  return response.data;
};
