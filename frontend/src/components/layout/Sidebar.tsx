
import { NavLink } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const navigation: Record<string, NavItem[]> = {
  SUPER_ADMIN: [
    { label: "Dashboard", path: "/super-admin/dashboard", icon: "▦" },
    { label: "Communities", path: "/super-admin/communities", icon: "▤" },
    { label: "Apartment Admins", path: "/super-admin/admins", icon: "♙" },
    { label: "Suppliers", path: "/super-admin/suppliers", icon: "♧" },
  ],

  APARTMENT_ADMIN: [
    { label: "Dashboard", path: "/apartment-admin/dashboard", icon: "▦" },
    { label: "Residents", path: "/apartment-admin/residents", icon: "♙" },
  ],

  SUPPLIER: [
    { label: "Dashboard", path: "/supplier/dashboard", icon: "▦" },
    { label: "Products", path: "/supplier/products", icon: "▤" },
    { label: "Orders", path: "/supplier/orders", icon: "▣" },
  ],

  RESIDENT: [
    { label: "Dashboard", path: "/resident/dashboard", icon: "▦" },
    { label: "Products", path: "/resident/products", icon: "▤" },
    { label: "My Orders", path: "/resident/orders", icon: "▣" },
    { label: "My Wallet", path: "/resident/wallet", icon: "◉" },
  ],
};

function Sidebar() {
  const { user } = useAuth();

  if (!user) return null;

  const items = navigation[user.role] ?? [];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">GB</div>
        <span>gather buy</span>
      </div>

      <div className="sidebar-section-label">MENU</div>

      <nav className="sidebar-navigation">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-details">
            <strong>{user.full_name}</strong>
            <span>{user.role.replaceAll("_", " ")}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
