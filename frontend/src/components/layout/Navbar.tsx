
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";

interface NavbarProps {
  title: string;
}

function Navbar({ title }: NavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleLogout = async () => {
    try {
      setError("");
      await logout();

      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
      setError("Unable to log out. Please try again.");
    }
  };

  return (
    <header className="dashboard-navbar">
      <div>
        <h1>{title}</h1>
        <p>Manage your Gather Buy platform</p>
      </div>

      <div className="navbar-user">
        <div className="navbar-avatar">
          {user?.full_name.charAt(0).toUpperCase()}
        </div>

        <div className="navbar-user-details">
          <strong>{user?.full_name}</strong>
          <span>{user?.role.replaceAll("_", " ")}</span>
        </div>

        <button
          className="navbar-logout-btn"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      {error && <p className="navbar-error">{error}</p>}
    </header>
  );
}

export default Navbar;
