
import { useEffect, useState } from "react";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import {
  getBulkOrders,
  getBulkOrderCycles,
  confirmBulkOrder,
  dispatchBulkOrder,
} from "./orderService";
import type { BulkOrder, BulkOrderCycle } from "./orderService";
import "./OrdersPage.css";

function OrdersPage() {
  const [cycles, setCycles] = useState<BulkOrderCycle[]>([]);
  const [bulkOrder, setBulkOrder] = useState<BulkOrder | null>(null);

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchCycles = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getBulkOrderCycles();
      setCycles(data);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Failed to fetch order cycles."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCycles();
  }, []);

  const viewOrders = async (communityId: number, orderDate: string) => {
    try {
      setDetailsLoading(true);
      setError("");
      setMessage("");

      const data = await getBulkOrders(communityId, orderDate);
      setBulkOrder(data);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Failed to fetch bulk orders."
      );
      setBulkOrder(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleAction = async (action: "confirm" | "dispatch") => {
    if (!bulkOrder) return;

    try {
      setActionLoading(true);
      setError("");
      setMessage("");

      const actionFunction =
        action === "confirm" ? confirmBulkOrder : dispatchBulkOrder;

      const response = await actionFunction(
        bulkOrder.community_id,
        bulkOrder.order_date
      );

      setMessage(response.message || "Action completed successfully.");

      await viewOrders(bulkOrder.community_id, bulkOrder.order_date);
      await fetchCycles();
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Unable to process bulk order."
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <DashboardLayout title="Bulk Orders">
      <div className="orders-page">

        <div className="orders-page-header">
          <div>
            <h2>Community Bulk Orders</h2>
            <p>View and manage orders across all communities.</p>
          </div>
        </div>

        {error && <div className="orders-error">{error}</div>}
        {message && <div className="orders-success">{message}</div>}

        <div className="bulk-order-card">
          <div className="cycles-section-header">
            <div>
              <h3>Order Cycles</h3>
              <p>Manage bulk orders from your communities</p>
            </div>

            <span className="cycles-count">
              {cycles.length} Active Cycles
            </span>
          </div>

          {loading ? (
            <p>Loading order cycles...</p>
          ) : cycles.length === 0 ? (
            <p className="orders-empty">No bulk orders found.</p>
          ) : (
            <div className="order-cycle-list">
              {cycles.map((cycle) => (
                <div
                  className={`order-cycle-item ${
                    bulkOrder?.community_id === cycle.community_id &&
                    bulkOrder?.order_date === cycle.order_date
                      ? "selected"
                      : ""
                  }`}
                  key={`${cycle.community_id}-${cycle.order_date}`}
                >
                  <div className="order-cycle-info">
                      <div className="cycle-community">
                        <div className="community-icon">⌂</div>
                        <div>
                          <strong>{cycle.community_name}</strong>
                          <span className="cycle-date">{cycle.order_date}</span>
                        </div>
                      </div>

                      <div className="cycle-meta">
                        <span>
                          <strong>{cycle.total_orders}</strong> Orders
                        </span>
                        <span>
                          <strong>{cycle.total_residents}</strong> Residents
                        </span>
                      </div>
                    </div>

                  <div className="order-cycle-actions">
                    <span className={`order-status ${cycle.status.toLowerCase()}`}>
                      {cycle.status}
                    </span>

                    <button
                      className="orders-search-button"
                      onClick={() =>
                        viewOrders(cycle.community_id, cycle.order_date)
                      }
                      disabled={detailsLoading}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {detailsLoading && <p>Loading selected order...</p>}

        {bulkOrder && !detailsLoading && (
          <div className="bulk-order-card">
            <div className="bulk-order-header">
              <div>
                <h3>Community #{bulkOrder.community_id}</h3>
                <p>Order Date: {bulkOrder.order_date}</p>

                <span className={`order-status ${bulkOrder.status.toLowerCase()}`}>
                  {bulkOrder.status}
                </span>
              </div>

              <span className="bulk-order-count">
                {bulkOrder.products.length} Products
              </span>
            </div>

            <div className="bulk-order-table-wrapper">
              <table className="bulk-order-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Unit</th>
                    <th>Retail Price</th>
                    <th>Total Quantity</th>
                    <th>Residents</th>
                  </tr>
                </thead>

                <tbody>
                  {bulkOrder.products.map((product) => (
                    <tr key={product.product_id}>
                      <td>{product.product_name}</td>
                      <td>{product.unit}</td>
                      <td>
                        ₹{Number(product.retail_price).toFixed(2)}
                      </td>
                      <td>{product.total_quantity}</td>
                      <td>{product.resident_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {bulkOrder.products.length === 0 && (
              <p className="orders-empty">No products found.</p>
            )}

            <div className="bulk-order-actions">
              {bulkOrder.status === "PENDING" && (
                <button
                  className="confirm-button"
                  onClick={() => handleAction("confirm")}
                  disabled={actionLoading || bulkOrder.products.length === 0}
                >
                  {actionLoading ? "Processing..." : "Confirm Bulk Order"}
                </button>
              )}

              {bulkOrder.status === "CONFIRMED" && (
                <button
                  className="dispatch-button"
                  onClick={() => handleAction("dispatch")}
                  disabled={actionLoading || bulkOrder.products.length === 0}
                >
                  {actionLoading ? "Processing..." : "Dispatch Bulk Order"}
                </button>
              )}

              {bulkOrder.status === "DISPATCHED" && (
                <p className="orders-completed">
                  This bulk order has been dispatched.
                </p>
              )}

              {bulkOrder.status === "MIXED" && (
                <p className="orders-warning">
                  Orders have different statuses. Please review them.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default OrdersPage;
