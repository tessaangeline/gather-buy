
import api from "../../../services/api";

// Data sent when placing an order
export interface PlaceOrderItem {
  product_id: number;
  quantity: number;
}

export interface UpdateOrderRequest {
  items: PlaceOrderItem[];
}

// Product information included inside an order item
export interface OrderProduct {
  id: number;
  name: string;
  image_url: string | null;
}

// Individual product inside an order
export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  retail_price: number | string;
  final_unit_price: number | string | null;
  product: OrderProduct;
}

// Complete order information
export interface Order {
  id: number;
  resident_id: number;
  community_id: number;
  order_date: string;
  status: "PENDING" | "CONFIRMED" | "DISPATCHED";
  total_amount: number | string;
  final_amount: number | string | null;
  cashback_amount: number | string;
  items: OrderItem[];
}

// Place a new order
export const placeResidentOrder = async (
  items: PlaceOrderItem[]
): Promise<Order> => {
  const response = await api.post("/orders/", { items });
  return response.data;
};

// Fetch all orders belonging to the logged-in resident
export const getMyOrders = async (): Promise<Order[]> => {
  const response = await api.get("/orders/");
  return response.data;
};

// Fetch details of one particular order
export const getOrderById = async (
  orderId: number
): Promise<Order> => {
  const response = await api.get(`/orders/${orderId}`);
  return response.data;
};

// Update an existing resident order
export const updateResidentOrder = async (
  orderId: number,
  items: PlaceOrderItem[]
): Promise<Order> => {
  const response = await api.put(`/orders/${orderId}`, {
    items,
  });

  return response.data;
};
