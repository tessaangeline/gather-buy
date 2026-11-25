
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { CartProvider } from "../cart/CartContext";
import "./ResidentLayout.css";

function ResidentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <CartProvider>
      <div className="resident-layout">

        {/* Header */}
        <header className="resident-header">

          <div className="resident-header-top">
            <NavLink to="/resident/shop" className="resident-logo">
              <span className="resident-logo-mark">GB</span>
              <span>gather buy</span>
            </NavLink>

            <button
              className="resident-logout"
              onClick={handleLogout}
              title="Logout"
            >
              Logout
            </button>
          </div>

          {/* Delivery Location */}
          <div className="resident-location">
            <span className="location-icon">⌖</span>

            <div>
              <small>DELIVERING TO</small>
              <strong>
                {user?.flat_number
                  ? `Flat ${user.flat_number}`
                  : "Your apartment"}
              </strong>
            </div>
          </div>

          {/* Navigation */}
          <nav className="resident-bottom-nav">

            <NavLink
              to="/resident/shop"
              className={({ isActive }) =>
                `resident-nav-item ${isActive ? "active" : ""}`
              }
            >
              <span>⌂</span>
              <small>Shop</small>
            </NavLink>

            <NavLink
              to="/resident/cart"
              className={({ isActive }) =>
                `resident-nav-item ${isActive ? "active" : ""}`
              }
            >
              <span>🛒</span>
              <small>Cart</small>
            </NavLink>

            <NavLink
              to="/resident/orders"
              className={({ isActive }) =>
                `resident-nav-item ${isActive ? "active" : ""}`
              }
            >
              <span>▤</span>
              <small>Orders</small>
            </NavLink>

            <NavLink
              to="/resident/wallet"
              className={({ isActive }) =>
                `resident-nav-item ${isActive ? "active" : ""}`
              }
            >
              <span>₹</span>
              <small>Wallet</small>
            </NavLink>

            <NavLink
              to="/resident/profile"
              className={({ isActive }) =>
                `resident-nav-item ${isActive ? "active" : ""}`
              }
            >
              <span>♙</span>
              <small>Profile</small>
            </NavLink>

          </nav>
        </header>

        {/* Page Content */}
        <main className="resident-main">
          <Outlet />
        </main>

      </div>
    </CartProvider>
  );
}

export default ResidentLayout;
