
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../components/layout/DashboardLayout";

import { getProductStats } from "../products/productService";
import type { ProductStats } from "../products/productService";

import { getBulkOrderCycles } from "../orders/orderService";
import type { BulkOrderCycle } from "../orders/orderService";

import "./SupplierDashboard.css";

function SupplierDashboard() {
  const [productStats, setProductStats] = useState<ProductStats | null>(null);
  const [cycles, setCycles] = useState<BulkOrderCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const [products, orderCycles] = await Promise.all([
          getProductStats(),
          getBulkOrderCycles(),
        ]);

        setProductStats(products);
        setCycles(orderCycles);
      } catch (err: any) {
        setError(
          err.response?.data?.detail ||
            "Failed to load dashboard information."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Calculate bulk order statistics
  const orderStats = {
    total: cycles.length,
    pending: cycles.filter((cycle) => cycle.status === "PENDING").length,
    confirmed: cycles.filter((cycle) => cycle.status === "CONFIRMED").length,
    dispatched: cycles.filter((cycle) => cycle.status === "DISPATCHED").length,
    mixed: cycles.filter((cycle) => cycle.status === "MIXED").length,
  };

  // Get the five most recent order cycles
  const recentCycles = cycles.slice(0, 5);

  return (
    <DashboardLayout title="Dashboard">
      <div className="supplier-dashboard">
        {/* Page Header */}
        <div className="supplier-dashboard-header">
          <div>
            <h2>Supplier Overview</h2>
            <p>
              Monitor your inventory and manage community bulk orders.
            </p>
          </div>
        </div>

        {error && <div className="orders-error">{error}</div>}

        {loading ? (
          <p className="dashboard-loading">Loading dashboard...</p>
        ) : (
          <>
            {/* Inventory Overview */}
            <section className="supplier-dashboard-section">
              <div className="dashboard-section-heading">
                <div>
                  <h3>Inventory Overview</h3>
                  <p>Current product catalogue and stock availability</p>
                </div>

                <Link to="/supplier/products">Manage Products →</Link>
              </div>

              <div className="supplier-stats-grid inventory-stats-grid">
                <div className="supplier-stat-card">
                  <span className="stat-label">Total Products</span>
                  <strong>{productStats?.total_products ?? 0}</strong>
                  <span className="stat-description">
                    Products in catalogue
                  </span>
                </div>

                <div className="supplier-stat-card">
                  <span className="stat-label">Active Products</span>
                  <strong>{productStats?.active_products ?? 0}</strong>
                  <span className="stat-description">Currently active</span>
                </div>

                <div className="supplier-stat-card">
                  <span className="stat-label">Out of Stock</span>
                  <strong>{productStats?.out_of_stock ?? 0}</strong>
                  <span className="stat-description">No available stock</span>
                </div>
              </div>
            </section>

            {/* Bulk Order Overview */}
            <section className="supplier-dashboard-section">
              <div className="dashboard-section-heading">
                <div>
                  <h3>Bulk Orders</h3>
                  <p>Overview of community order cycles</p>
                </div>

                <Link to="/supplier/orders">Manage Bulk Orders →</Link>
              </div>

              <div className="supplier-stats-grid bulk-order-stats-grid">
                <div className="supplier-stat-card">
                  <span className="stat-label">Total Order Cycles</span>
                  <strong>{orderStats.total}</strong>
                  <span className="stat-description">
                    Across all communities
                  </span>
                </div>

                <div className="supplier-stat-card pending-card">
                  <span className="stat-label">Pending</span>
                  <strong>{orderStats.pending}</strong>
                  <span className="stat-description">
                    Awaiting confirmation
                  </span>
                </div>

                <div className="supplier-stat-card confirmed-card">
                  <span className="stat-label">Confirmed</span>
                  <strong>{orderStats.confirmed}</strong>
                  <span className="stat-description">Awaiting dispatch</span>
                </div>

                <div className="supplier-stat-card dispatched-card">
                  <span className="stat-label">Dispatched</span>
                  <strong>{orderStats.dispatched}</strong>
                  <span className="stat-description">
                    Successfully dispatched
                  </span>
                </div>
              </div>

              {/* Mixed Status Warning */}
              {orderStats.mixed > 0 && (
                <div className="dashboard-mixed-note">
                  <strong>
                    {orderStats.mixed} order cycle(s) need review
                  </strong>
                  <span>
                    Some orders within these cycles have different statuses.
                    Review them before proceeding.
                  </span>
                </div>
              )}
            </section>

            {/* Recent Bulk Orders */}
            <section className="supplier-dashboard-section">
              <div className="dashboard-section-heading">
                <div>
                  <h3>Recent Bulk Orders</h3>
                  <p>Latest community order cycles</p>
                </div>

                <Link to="/supplier/orders">View All →</Link>
              </div>

              {recentCycles.length === 0 ? (
                <div className="dashboard-empty">
                  No bulk orders available yet.
                </div>
              ) : (
                <div className="dashboard-table-wrapper">
                  <table className="dashboard-orders-table">
                    <thead>
                      <tr>
                        <th>Community</th>
                        <th>Order Date</th>
                        <th>Orders</th>
                        <th>Residents</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {recentCycles.map((cycle) => (
                        <tr
                          key={`${cycle.community_id}-${cycle.order_date}`}
                        >
                          <td>{cycle.community_name}</td>
                          <td>{cycle.order_date}</td>
                          <td>{cycle.total_orders}</td>
                          <td>{cycle.total_residents}</td>
                          <td>
                            <span
                              className={`dashboard-status ${cycle.status.toLowerCase()}`}
                            >
                              {cycle.status}
                            </span>
                          </td>
                          <td>
                            <Link
                              to="/supplier/orders"
                              className="dashboard-view-link"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default SupplierDashboard;
