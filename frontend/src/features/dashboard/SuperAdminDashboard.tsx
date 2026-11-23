
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../services/api";
import "./SuperAdminDashboard.css";

interface DashboardStats {
  communities: number;
  apartmentAdmins: number;
  suppliers: number;
}

function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    communities: 0,
    apartmentAdmins: 0,
    suppliers: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const [communities, admins, suppliers] = await Promise.all([
          api.get("/communities/"),
          api.get("/users/apartment-admins"),
          api.get("/users/suppliers"),
        ]);

        setStats({
          communities: communities.data.length,
          apartmentAdmins: admins.data.length,
          suppliers: suppliers.data.length,
        });
      } catch (err) {
        console.error("Dashboard data loading failed:", err);
        setError("Unable to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: "Communities",
      value: stats.communities,
      description: "Registered communities",
      icon: "⌂",
    },
    {
      title: "Apartment Admins",
      value: stats.apartmentAdmins,
      description: "Registered administrators",
      icon: "♙",
    },
    {
      title: "Suppliers",
      value: stats.suppliers,
      description: "Registered suppliers",
      icon: "▤",
    },
  ];

  return (
    <DashboardLayout title="Dashboard">
      <div className="dashboard-welcome">
        <div>
          <h2>Welcome to Gather Buy!</h2>
          <p>Here's an overview of your platform.</p>
        </div>
      </div>

      {error && <div className="dashboard-error">{error}</div>}

      <div className="dashboard-stats">
        {statCards.map((card) => (
          <div className="stat-card" key={card.title}>
            <div className="stat-card-top">
              <span>{card.title}</span>
              <span className="stat-icon">{card.icon}</span>
            </div>

            <h3>
              {loading ? "..." : card.value}
            </h3>

            <p>{card.description}</p>
          </div>
        ))}
      </div>

      <div className="dashboard-info">
        <h3>Platform Overview</h3>
        <p>
          Manage communities, apartment administrators and suppliers
          from one place.
        </p>
      </div>
    </DashboardLayout>
  );
}

export default SuperAdminDashboard;
