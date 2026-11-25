
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "../services/residentService";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("gatherbuy-cart") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("gatherbuy-cart", JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product) => {
    setItems((current) => {
      const existing = current.find(
        (item) => item.product.id === product.id
      );

      if (existing) {
        return current.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: Math.min(
                  item.quantity + 1,
                  product.stock_on_hand - product.stock_reserved
                ),
              }
            : item
        );
      }

      return [
        ...current,
        { product, quantity: 1 },
      ];
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    setItems((current) =>
      current
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: number) => {
    setItems((current) =>
      current.filter((item) => item.product.id !== productId)
    );
  };

  const clearCart = () => setItems([]);

  const cartCount = items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const cartTotal = items.reduce(
    (total, item) =>
      total + Number(item.product.retail_price) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
