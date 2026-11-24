
import api from "../../services/api";

export interface Community {
  id: number;
  name: string;
  address: string;
}

interface CreateCommunityData {
  name: string;
  address: string;
}

export interface UpdateCommunityData {
  name: string;
  address: string;
}

// Fetch all communities
export const getCommunities = async (): Promise<Community[]> => {
  const response = await api.get("/communities/");
  return response.data;
};

// Create a new community
export const createCommunity = async (
  data: CreateCommunityData
): Promise<Community> => {
  const response = await api.post("/communities/", data);
  return response.data;
};

// Update an existing community
export const updateCommunity = async (
  communityId: number,
  data: UpdateCommunityData
): Promise<Community> => {
  const response = await api.put(`/communities/${communityId}`, data);
  return response.data;
};

// Delete a community
export const deleteCommunity = async (
  communityId: number
): Promise<void> => {
  await api.delete(`/communities/${communityId}`);
};
