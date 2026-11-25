import api from "../../../services/api";

export interface BulkOrderProduct {
  product_id: number;
  product_name: string;
  unit: string;
  retail_price: number;
  total_quantity: number;
  resident_count: number;
}

export interface BulkOrder {
  community_id: number;
  order_date: string;
  products: BulkOrderProduct[];
  status: string;
}

export interface BulkOrderCycle {
  community_id: number;
  community_name: string;
  order_date: string;
  total_orders: number;
  total_residents: number;
  status: string;
}

export const getBulkOrders = async (
  communityId: number,
  orderDate: string
): Promise<BulkOrder> => {
  const response = await api.get("/orders/bulk", {
    params: {
      community_id: communityId,
      order_date: orderDate,
    },
  });

  return response.data;
};

export const confirmBulkOrder = async (
  communityId: number,
  orderDate: string
) => {
  const response = await api.patch("/orders/bulk/confirm", null, {
    params: {
      community_id: communityId,
      order_date: orderDate,
    },
  });

  return response.data;
};

export const dispatchBulkOrder = async (
  communityId: number,
  orderDate: string
) => {
  const response = await api.patch("/orders/bulk/dispatch", null, {
    params: {
      community_id: communityId,
      order_date: orderDate,
    },
  });

  return response.data;
};

export const getBulkOrderCycles = async (): Promise<BulkOrderCycle[]> => {
  const response = await api.get("/orders/bulk/cycles");
  return response.data;
};