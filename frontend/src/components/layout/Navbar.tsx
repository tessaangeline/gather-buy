
import { useAuth } from "../../features/auth/AuthContext";

interface NavbarProps {
  title: string;
}

function Navbar({ title }: NavbarProps) {
  const { user } = useAuth();

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
      </div>
    </header>
  );
}

export default Navbar;
