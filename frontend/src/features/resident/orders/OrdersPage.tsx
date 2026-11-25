
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyOrders, type Order } from "../services/orderService";
import "./OrdersPage.css";

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getMyOrders();
        setOrders(data);
      } catch (err: any) {
        console.error("Failed to fetch orders:", err);
        setError(
          err.response?.data?.detail ||
          "Unable to load your orders. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatAmount = (amount: number | string | null) => {
    return `₹${Number(amount ?? 0).toFixed(2)}`;
  };

  const getStatusClass = (status: Order["status"]) => {
    switch (status) {
      case "PENDING":
        return "pending";
      case "CONFIRMED":
        return "confirmed";
      case "DISPATCHED":
        return "dispatched";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div className="orders-loading">
        <div className="orders-spinner"></div>
        <p>Loading your orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-message">
        <h3>Something went wrong</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-header">
        <div>
          <h1>My Orders</h1>
          <p>Keep track of your purchases and deliveries.</p>
        </div>

        <span className="orders-count">
          {orders.length} {orders.length === 1 ? "Order" : "Orders"}
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="orders-empty">
          <div className="empty-icon">🛍️</div>
          <h2>No orders yet</h2>
          <p>
            You haven't placed any orders yet. Explore the store
            and find something you need!
          </p>
          <button onClick={() => navigate("/resident/shop")}>
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const itemCount = order.items.reduce(
              (total, item) => total + item.quantity,
              0
            );

            const amount =
              order.final_amount ?? order.total_amount;

            return (
              <div
                className="order-card"
                key={order.id}
                onClick={() =>
                  navigate(`/resident/orders/${order.id}`)
                }
              >
                <div className="order-card-top">
                  <div>
                    <h3 className="order-title">Your Order</h3>
                    <span className="order-date-small">
                      {formatDate(order.order_date)}
                    </span>
                  </div>

                  <span
                    className={`order-status ${getStatusClass(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="order-card-info">
                  <div>
                    <span className="info-label">Order date</span>
                    <p>{formatDate(order.order_date)}</p>
                  </div>

                  <div>
                    <span className="info-label">Items</span>
                    <p>
                      {itemCount}{" "}
                      {itemCount === 1 ? "item" : "items"}
                    </p>
                  </div>

                  <div>
                    <span className="info-label">Total amount</span>
                    <p className="order-amount">
                      {formatAmount(amount)}
                    </p>
                  </div>
                </div>

                <div className="order-card-footer">
                  <span>View order details</span>
                  <span className="order-arrow">→</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
