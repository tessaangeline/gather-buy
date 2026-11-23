
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  getApartmentAdmins,
  updateApartmentAdminStatus,
  createApartmentAdmin,
  type ApartmentAdmin,
} from "./userService";
import "./ApartmentAdminsPage.css";

import {
  getCommunities,
  type Community,
} from "../communities/communityService";


function ApartmentAdminsPage() {
    const [admins, setAdmins] = useState<ApartmentAdmin[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [communities, setCommunities] = useState<Community[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [communityId, setCommunityId] = useState("");
    const [submitting, setSubmitting] = useState(false);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getApartmentAdmins();
      setAdmins(data);
    } catch (err) {
      console.error("Failed to fetch apartment admins:", err);
      setError("Unable to load apartment admins.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCommunities = async () => {
    try {
        const data = await getCommunities();
        setCommunities(data);
    } catch (err) {
        console.error("Failed to fetch communities:", err);
        setError("Unable to load communities.");
    }
    };

  useEffect(() => {
    fetchAdmins();
    fetchCommunities();
  }, []);

  const handleCreateAdmin = async (
    event: React.FormEvent<HTMLFormElement>
    ) => {
    event.preventDefault();

    try {
        setSubmitting(true);
        setError("");

        await createApartmentAdmin({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        role: "APARTMENT_ADMIN",
        community_id: Number(communityId),
        });

        setFullName("");
        setEmail("");
        setPassword("");
        setCommunityId("");
        setShowForm(false);

        await fetchAdmins();
    } catch (err) {
        console.error("Failed to create apartment admin:", err);
        setError("Unable to create apartment admin. Please check the details.");
    } finally {
        setSubmitting(false);
    }
    };
 

  const handleStatusChange = async (admin: ApartmentAdmin) => {
    try {
        setError("");

        const newStatus = !admin.is_active;

        await updateApartmentAdminStatus(admin.id, newStatus);

        setAdmins((currentAdmins) =>
        currentAdmins.map((item) =>
            item.id === admin.id
            ? { ...item, is_active: newStatus }
            : item
        )
        );
    } catch (err) {
        console.error("Failed to update admin status:", err);
        setError("Unable to update administrator status.");
    }
    };

  return (
    <DashboardLayout title="Apartment Admins">
      <div className="admins-header">
        <div>
          <h2>Apartment Admin Management</h2>
          <p>Manage administrators across your communities.</p>
        </div>
      </div>


    <button
    className="add-admin-button"
    onClick={() => setShowForm(!showForm)}
    >
    + Add Apartment Admin
    </button>

    {showForm && (
    <form
        className="admin-form"
        onSubmit={handleCreateAdmin}
        autoComplete="off"
    >
        <h3>Add New Apartment Admin</h3>

        <label htmlFor="admin-name">Full Name</label>
        <input
        id="admin-name"
        type="text"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Enter full name"
        required
        />

        <label htmlFor="admin-email">Email</label>
        <input
        id="admin-email"
        type="email"
        name="new-admin-email"
        autoComplete="off"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter email"
        required
        />

        <label htmlFor="admin-password">Initial Password</label>
        <input
        id="admin-password"
        type="password"
        name="new-admin-password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter initial password"
        minLength={8}
        required
        />

        <label htmlFor="admin-community">Community</label>
        <select
        id="admin-community"
        value={communityId}
        onChange={(e) => setCommunityId(e.target.value)}
        required
        >
        <option value="">Select a community</option>

        {communities.map((community) => (
            <option key={community.id} value={community.id}>
            {community.name}
            </option>
        ))}
        </select>

        <div className="admin-form-actions">
        <button
            type="button"
            onClick={() => setShowForm(false)}
            disabled={submitting}
        >
            Cancel
        </button>

        <button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Admin"}
        </button>
        </div>
    </form>
    )}


      {error && <div className="admins-error">{error}</div>}

      <div className="admins-table-container">
        <div className="admins-table-heading">
          <h3>Registered Apartment Admins</h3>
          <span>{admins.length} administrators</span>
        </div>

        {loading ? (
          <p className="admins-message">Loading administrators...</p>
        ) : admins.length === 0 ? (
          <p className="admins-message">
            No apartment administrators registered yet.
          </p>
        ) : (
          <table className="admins-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Community</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id}>
                  <td>{admin.full_name}</td>
                  <td>{admin.email}</td>
                  <td>
                    {communities.find(
                        (community) => community.id === admin.community_id
                    )?.name ?? "Not assigned"}
                    </td>
                  <td>
                    <span
                      className={
                        admin.is_active
                          ? "admin-status active"
                          : "admin-status inactive"
                      }
                    >
                      {admin.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <label className="status-toggle">
                        <input
                            type="checkbox"
                            checked={admin.is_active}
                            onChange={() => handleStatusChange(admin)}
                            aria-label={`Change status for ${admin.full_name}`}
                        />
                        <span className="toggle-slider"></span>
                        </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}

export default ApartmentAdminsPage;
