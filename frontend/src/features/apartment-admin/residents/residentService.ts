import api from "../../../services/api";

export interface Resident {
  id: number;
  full_name: string;
  email: string;
  role: "RESIDENT";
  is_active: boolean;
  community_id: number | null;
  flat_number: string | null;
  wallet_balance: number | string | null;
}

export interface CreateResidentData {
  full_name: string;
  email: string;
  password: string;
  role: "RESIDENT";
  flat_number: string;
}

export interface UpdateResidentData {
  full_name: string;
  email: string;
  flat_number: string;
}

// Fetch residents belonging to the logged-in Apartment Admin's community
export const getResidents = async (): Promise<Resident[]> => {
  const response = await api.get("/users/residents");
  return response.data;
};

// Create a new resident
export const createResident = async (
  data: CreateResidentData
): Promise<Resident> => {
  const response = await api.post("/users/", data);
  return response.data;
};

// Update resident details
export const updateResident = async (
  residentId: number,
  data: UpdateResidentData
): Promise<Resident> => {
  const response = await api.put(`/users/${residentId}`, data);
  return response.data;
};

// Activate or deactivate a resident
export const updateResidentStatus = async (
  residentId: number,
  is_active: boolean
): Promise<Resident> => {
  const response = await api.patch(`/users/${residentId}/status`, {
    is_active,
  });
  return response.data;
};