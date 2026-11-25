
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import "./ProfilePage.css";

const ProfilePage = () => {
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

  if (!user) {
    return (
      <div className="profile-page">
        <p>Unable to load profile details.</p>
      </div>
    );
  }

  const initial = user.full_name?.trim().charAt(0).toUpperCase() || "R";

  return (
    <div className="profile-page">

      {/* Page heading */}
      <div className="profile-header">
        <span className="profile-eyebrow">YOUR ACCOUNT</span>
        <h1>My Profile</h1>
        <p>Manage your personal and account information.</p>
      </div>

      {/* Profile identity card */}
      <section className="profile-card">
        <div className="profile-avatar">
          {initial}
        </div>

        <div className="profile-identity">
          <h2>{user.full_name}</h2>
          <p className="profile-email">{user.email}</p>

          <div className="profile-badges">
            <span className="profile-role">Resident</span>

            <span
              className={`profile-status ${
                user.is_active ? "status-active" : "status-inactive"
              }`}
            >
              <span className="profile-status-dot" />
              {user.is_active ? "Active account" : "Inactive account"}
            </span>
          </div>
        </div>
      </section>

      {/* Account information */}
      <section className="profile-details">
        <div className="profile-section-heading">
          <div className="profile-section-icon">⌑</div>
          <div>
            <h3>Account Information</h3>
            <p>Your registered account details</p>
          </div>
        </div>

        <div className="profile-details-grid">

          <div className="profile-detail-row">
            <span className="profile-detail-label">Full Name</span>
            <strong>{user.full_name}</strong>
          </div>

          <div className="profile-detail-row">
            <span className="profile-detail-label">Email Address</span>
            <strong>{user.email}</strong>
          </div>

          <div className="profile-detail-row">
            <span className="profile-detail-label">Account Role</span>
            <strong>Resident</strong>
          </div>

          <div className="profile-detail-row">
            <span className="profile-detail-label">Community ID</span>
            <strong>{user.community_id ?? "Not assigned"}</strong>
          </div>

          <div className="profile-detail-row">
            <span className="profile-detail-label">Flat Number</span>
            <strong>{user.flat_number ?? "Not assigned"}</strong>
          </div>

          <div className="profile-detail-row">
            <span className="profile-detail-label">Account Status</span>
            <strong className={user.is_active ? "detail-active" : "detail-inactive"}>
              {user.is_active ? "Active" : "Inactive"}
            </strong>
          </div>

        </div>
      </section>

      {/* Account actions */}
      <section className="profile-actions">
        <div>
          <h3>Account Actions</h3>
          <p>Sign out of your Gather Buy account.</p>
        </div>

        <button
          className="profile-logout-button"
          onClick={handleLogout}
        >
          <span>↪</span>
          Logout
        </button>
      </section>

    </div>
  );
};

export default ProfilePage;
