
import api from "../../services/api";

export interface ApartmentAdmin {
  id: number;
  full_name: string;
  email: string;
  role: "APARTMENT_ADMIN";
  is_active: boolean;
  community_id: number | null;
  flat_number: string | null;
}

export interface CreateApartmentAdminData {
  full_name: string;
  email: string;
  password: string;
  role: "APARTMENT_ADMIN";
  community_id: number;
}

export interface Supplier {
  id: number;
  full_name: string;
  email: string;
  role: "SUPPLIER";
  is_active: boolean;
  community_id: number | null;
  flat_number: string | null;
}

export interface CreateSupplierData {
  full_name: string;
  email: string;
  password: string;
  role: "SUPPLIER";
}

export interface UpdateUserData {
  full_name?: string;
  email?: string;
  community_id?: number;
}

export const getSuppliers = async (): Promise<Supplier[]> => {
  const response = await api.get("/users/suppliers");
  return response.data;
};

export const createSupplier = async (
  data: CreateSupplierData
): Promise<Supplier> => {
  const response = await api.post("/users/", data);
  return response.data;
};

export const updateSupplierStatus = async (
  userId: number,
  isActive: boolean
): Promise<Supplier> => {
  const response = await api.patch(`/users/${userId}/status`, {
    is_active: isActive,
  });
  return response.data;
};

// Fetch all apartment admins
export const getApartmentAdmins = async (): Promise<ApartmentAdmin[]> => {
  const response = await api.get("/users/apartment-admins");
  return response.data;
};

// Create an apartment admin
export const createApartmentAdmin = async (
  data: CreateApartmentAdminData
): Promise<ApartmentAdmin> => {
  const response = await api.post("/users/", data);
  return response.data;
};

// Activate or deactivate an apartment admin
export const updateApartmentAdminStatus = async (
  userId: number,
  isActive: boolean
): Promise<ApartmentAdmin> => {
  const response = await api.patch(`/users/${userId}/status`, {
    is_active: isActive,
  });

  return response.data;
};

export const updateUser = async (
  userId: number,
  data: UpdateUserData
) => {
  const response = await api.put(`/users/${userId}`, data);
  return response.data;
};

export const deleteUser = async (
  userId: number
): Promise<void> => {
  await api.delete(`/users/${userId}`);
};