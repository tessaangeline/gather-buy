
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import api from "../../../services/api";
import "./ApartmentDashboard.css";

interface Resident {
  id: number;
  full_name: string;
  email: string;
  flat_number: string | null;
  is_active: boolean;
}

interface ResidentStats {
  total: number;
  active: number;
  inactive: number;
}

function ApartmentDashboard() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/users/residents");
        setResidents(response.data);
      } catch (err: any) {
        console.error("Apartment dashboard loading failed:", err);

        setError(
          err.response?.data?.detail ||
          "Unable to load community information. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats: ResidentStats = {
    total: residents.length,
    active: residents.filter((resident) => resident.is_active).length,
    inactive: residents.filter((resident) => !resident.is_active).length,
  };

  const statCards = [
    {
      title: "Total Residents",
      value: stats.total,
      description: "Residents in your community",
      icon: "♙",
      className: "apartment-total",
    },
    {
      title: "Active Residents",
      value: stats.active,
      description: "Currently active accounts",
      icon: "✓",
      className: "apartment-active",
    },
    {
      title: "Inactive Residents",
      value: stats.inactive,
      description: "Deactivated accounts",
      icon: "○",
      className: "apartment-inactive",
    },
  ];

  const recentResidents = residents.slice(0, 5);

  return (
    <DashboardLayout title="Dashboard">
      <div className="apartment-dashboard">
        <div className="apartment-dashboard-header">
          <div>
            <h2>Community Overview</h2>
            <p>
              Manage residents and monitor your community on Gather Buy.
            </p>
          </div>

          <Link
            to="/apartment-admin/residents"
            className="apartment-primary-button"
          >
            + Manage Residents
          </Link>
        </div>

        {error && (
          <div className="apartment-dashboard-error">
            {error}
          </div>
        )}

        <section className="apartment-stats-grid">
          {statCards.map((card) => (
            <div
              className="apartment-stat-card"
              key={card.title}
            >
              <div className="apartment-stat-top">
                <span>{card.title}</span>
                <span className={`apartment-stat-icon ${card.className}`}>
                  {card.icon}
                </span>
              </div>

              <h3>{loading ? "..." : card.value}</h3>
              <p>{card.description}</p>
            </div>
          ))}
        </section>

        <section className="apartment-dashboard-section">
          <div className="apartment-section-heading">
            <div>
              <h3>Residents</h3>
              <p>Overview of residents in your assigned community</p>
            </div>

            <Link to="/apartment-admin/residents">
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="apartment-dashboard-empty">
              Loading residents...
            </div>
          ) : error ? (
            <div className="apartment-dashboard-empty">
              Resident information could not be loaded.
            </div>
          ) : recentResidents.length === 0 ? (
            <div className="apartment-dashboard-empty">
              <h3>No residents yet</h3>
              <p>
                Start by adding residents to your community.
              </p>
              <Link to="/apartment-admin/residents">
                Add Residents →
              </Link>
            </div>
          ) : (
            <div className="apartment-table-wrapper">
              <table className="apartment-residents-table">
                <thead>
                  <tr>
                    <th>Resident</th>
                    <th>Email</th>
                    <th>Flat Number</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {recentResidents.map((resident) => (
                    <tr key={resident.id}>
                      <td>{resident.full_name}</td>
                      <td>{resident.email}</td>
                      <td>{resident.flat_number || "—"}</td>
                      <td>
                        <span
                          className={`apartment-resident-status ${
                            resident.is_active ? "active" : "inactive"
                          }`}
                        >
                          {resident.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

export default ApartmentDashboard;
