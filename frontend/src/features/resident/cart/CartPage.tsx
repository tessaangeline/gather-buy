
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "./CartContext";
import { placeResidentOrder } from "../services/orderService";
import { getProductImageUrl } from "../services/residentService";
import { useAuth } from "../../auth/AuthContext";

import "./CartPage.css";

function CartPage() {
  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartCount,
    cartTotal,
  } = useCart();

  const { user } = useAuth();
  const navigate = useNavigate();

  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");
  const [successOrderId, setSuccessOrderId] = useState<number | null>(null);

  // Get the resident's actual wallet balance
  const walletBalance =
    user?.wallet_balance != null
      ? Number(user.wallet_balance)
      : null;

  // Calculate whether the wallet can cover the order
  const hasEnoughBalance =
    walletBalance !== null && walletBalance >= cartTotal;

  // Calculate the amount needed or the remaining balance
  const amountNeeded =
    walletBalance !== null && walletBalance < cartTotal
      ? cartTotal - walletBalance
      : 0;

  const remainingBalance =
    walletBalance !== null
      ? walletBalance - cartTotal
      : null;

  // Place order
  const handleCheckout = async () => {
    if (
      items.length === 0 ||
      placingOrder ||
      !hasEnoughBalance
    ) {
      return;
    }

    try {
      setPlacingOrder(true);
      setError("");

      const order = await placeResidentOrder(
        items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        }))
      );

      setSuccessOrderId(order.id);
      clearCart();
    } catch (err: any) {
      console.error("Order placement failed:", err);

      const message =
        err.response?.data?.detail ||
        "Unable to place your order. Please try again.";

      setError(message);
    } finally {
      setPlacingOrder(false);
    }
  };

  // Order success screen
    if (successOrderId !== null) {
    return (
        <div className="order-success-page">
        <div className="order-success-card">

            <div className="order-success-icon">
            <span>✓</span>
            </div>

            <div className="order-success-heading">
            <span className="success-eyebrow">
                ORDER CONFIRMED
            </span>

            <h1>Order placed successfully!</h1>

            <p>
                Your order has been received and added to
                your community's daily order cycle.
            </p>

            <span className="success-status">
                <span className="status-dot"></span>
                Pending
            </span>
            </div>

            <div className="success-next-steps">
            <h3>What happens next?</h3>

            <div className="success-step">
                <span className="step-icon">✓</span>
                <div>
                <strong>Order received</strong>
                <p>Your order has been successfully recorded.</p>
                </div>
            </div>

            <div className="success-step">
                <span className="step-icon">◎</span>
                <div>
                <strong>Community aggregation</strong>
                <p>Your order will be combined with other
                    residents' orders after the daily cutoff.</p>
                </div>
            </div>

            <div className="success-step">
                <span className="step-icon">□</span>
                <div>
                <strong>Supplier fulfilment</strong>
                <p>The supplier will confirm and dispatch
                    the community bulk order.</p>
                </div>
            </div>
            </div>

            <div className="success-actions">
            <button
                className="success-primary-button"
                onClick={() => navigate("/resident/orders")}
            >
                View my orders
            </button>

            <button
                className="success-secondary-button"
                onClick={() => navigate("/resident/shop")}
            >
                Continue shopping
            </button>
            </div>

        </div>
        </div>
    );
    }


  return (
    <div className="cart-page">
      <div className="cart-heading">
        <div>
          <h1>My Cart</h1>
          <p>Review your items before placing your order.</p>
        </div>

        <span>{cartCount} items</span>
      </div>

      {items.length === 0 ? (
        <div className="cart-empty">
            <span>🛒</span>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added anything yet.</p>

            <button onClick={() => navigate("/resident/shop")}>
                Browse products
            </button>
            </div>
      ) : (
        <div className="cart-content">
          <section className="cart-items-section">
            <div className="cart-section-heading">
              <h2>Cart items</h2>

              <button onClick={clearCart}>
                Clear cart
              </button>
            </div>

            {items.map(({ product, quantity }) => {
              const imageUrl = getProductImageUrl(product.image_url);

              const availableStock =
                product.stock_on_hand - product.stock_reserved;

              return (
                <article className="cart-item" key={product.id}>
                  <div className="cart-item-image">
                    {imageUrl ? (
                      <img src={imageUrl} alt={product.name} />
                    ) : (
                      <span>🛍️</span>
                    )}
                  </div>

                  <div className="cart-item-details">
                    <h3>{product.name}</h3>

                    <p>
                      ₹{Number(product.retail_price).toFixed(2)} / {product.unit}
                    </p>

                    <button
                      className="remove-item"
                      onClick={() => removeFromCart(product.id)}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="cart-item-actions">
                    <div className="quantity-control">
                      <button
                        onClick={() =>
                          updateQuantity(product.id, quantity - 1)
                        }
                      >
                        −
                      </button>

                      <span>{quantity}</span>

                      <button
                        disabled={quantity >= availableStock}
                        onClick={() =>
                          updateQuantity(product.id, quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>

                    <strong>
                      ₹{(
                        Number(product.retail_price) * quantity
                      ).toFixed(2)}
                    </strong>
                  </div>
                </article>
              );
            })}
          </section>

          {/* Order summary */}
          <aside className="cart-summary">
            <h2>Order summary</h2>

            <div className="summary-row">
              <span>Items ({cartCount})</span>
              <span>₹{cartTotal.toFixed(2)}</span>
            </div>

            <div className="summary-row">
              <span>Delivery charges</span>
              <span className="free-delivery">FREE</span>
            </div>

            <div className="summary-divider" />

            <div className="summary-row summary-total">
              <strong>Total amount</strong>
              <strong>₹{cartTotal.toFixed(2)}</strong>
            </div>

            <div className="summary-wallet-section">
              <div className="summary-row wallet-balance-row">
                <span>Your wallet balance</span>

                <strong>
                  {walletBalance !== null
                    ? `₹${walletBalance.toFixed(2)}`
                    : "Unavailable"}
                </strong>
              </div>

              {walletBalance !== null && (
                <div className="summary-row">
                  <span>
                    {hasEnoughBalance
                      ? "Balance after purchase"
                      : "Additional amount needed"}
                  </span>

                  <strong
                    className={
                      hasEnoughBalance
                        ? "remaining-balance"
                        : "insufficient-balance"
                    }
                  >
                    ₹{Math.abs(remainingBalance!).toFixed(2)}
                  </strong>
                </div>
              )}
            </div>

            {walletBalance !== null && !hasEnoughBalance ? (
              <div className="checkout-error">
                <strong>Insufficient wallet balance</strong>

                <p>
                  You need ₹{amountNeeded.toFixed(2)} more in your
                  wallet to place this order.
                </p>
              </div>
            ) : walletBalance === null ? (
              <div className="checkout-error">
                Unable to retrieve your wallet balance.
                Please refresh and try again.
              </div>
            ) : (
              <p className="checkout-note">
                The amount will be deducted from your wallet.
              </p>
            )}

            {error && (
              <div className="checkout-error">
                {error}
              </div>
            )}

            <button
              className="checkout-button"
              onClick={handleCheckout}
              disabled={
                placingOrder ||
                items.length === 0 ||
                walletBalance === null ||
                !hasEnoughBalance
              }
            >
              {placingOrder
                ? "Placing order..."
                : walletBalance === null
                  ? "Wallet unavailable"
                  : !hasEnoughBalance
                    ? "Insufficient wallet balance"
                    : "Place order"}
            </button>

            <button
              className="back-to-shop"
              onClick={() => navigate("/resident/shop")}
            >
              Continue shopping
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}

export default CartPage;
