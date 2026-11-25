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

export interface CreateProductData {
  name: string;
  description?: string;
  unit: string;
  retail_price: number | string;
  stock_on_hand: number;
  file?: File;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  unit?: string;
  retail_price?: number | string;
  file?: File;
}

export interface ProductStats {
  total_products: number;
  active_products: number;
  out_of_stock: number;
}

export const getProducts = async (
  skip: number = 0,
  limit: number = 10,
  search?: string,
  availability?: string
): Promise<Product[]> => {
  const response = await api.get<Product[]>("/products/", {
    params: {
      skip,
      limit,
      ...(search ? { search } : {}),
      ...(availability ? { availability } : {}),
    },
  });

  return response.data;
};

export const createProduct = async (
  productData: CreateProductData
): Promise<Product> => {
  const formData = new FormData();
    
  formData.append("name", productData.name);
  formData.append("unit", productData.unit);
  formData.append("retail_price", String(productData.retail_price));
  formData.append("stock_on_hand", String(productData.stock_on_hand));

  if (productData.description) {
    formData.append("description", productData.description);
  }

  if (productData.file) {
    formData.append("file", productData.file);
  }

  const response = await api.post<Product>("/products/", formData, {
    headers: {
        "Content-Type": undefined,
    },
    });
  return response.data;
};

export const updateProduct = async (
  productId: number,
  productData: UpdateProductData
): Promise<Product> => {
  const formData = new FormData();

  if (productData.name !== undefined) {
    formData.append("name", productData.name);
  }

  if (productData.description !== undefined) {
    formData.append("description", productData.description);
  }

  if (productData.unit !== undefined) {
    formData.append("unit", productData.unit);
  }

  if (productData.retail_price !== undefined) {
    formData.append("retail_price", String(productData.retail_price));
  }

  if (productData.file) {
    formData.append("file", productData.file);
  }

  const response = await api.put<Product>(
    `/products/${productId}`,
    formData,
    {
        headers: {
        "Content-Type": undefined,
        },
    }
    );

  return response.data;
};

export const adjustProductStock = async (
  productId: number,
  quantity: number,
  operation: "ADD" | "REMOVE"
): Promise<Product> => {
  const response = await api.patch<Product>(
    `/products/${productId}/stock`,
    {
      quantity,
      operation,
    }
  );

  return response.data;
};

export const updateProductStatus = async (
  productId: number,
  isActive: boolean
): Promise<Product> => {
  const response = await api.patch<Product>(
    `/products/${productId}/status`,
    {
      is_active: isActive,
    }
  );

  return response.data;
};

export const getAvailableStock = (product: Product): number => {
  return product.stock_on_hand - product.stock_reserved;
};

export const getProductStats = async (): Promise<ProductStats> => {
  const response = await api.get<ProductStats>("/products/stats");
  return response.data;
};