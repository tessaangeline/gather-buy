
import api from "../../../services/api";

export interface Product {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  unit: string;
  retail_price: number | string;
  stock_on_hand: number;
  stock_reserved: number;
  is_active: boolean;
}

export const getResidentProducts = async (
  search: string = ""
): Promise<Product[]> => {
  const response = await api.get("/products/", {
    params: {
      search: search || undefined,
      availability: "available",
      skip: 0,
      limit: 100,
    },
  });

  return response.data;
};

export const getProductImageUrl = (imageUrl: string | null) => {
  if (!imageUrl) return null;

  if (imageUrl.startsWith("http")) return imageUrl;

  return `http://localhost:8000${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
};
