
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
