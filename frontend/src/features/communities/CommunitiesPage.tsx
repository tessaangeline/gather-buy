
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  getCommunities,
  createCommunity,
  type Community,
} from "./communityService";
import "./CommunitiesPage.css";

function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getCommunities();
      setCommunities(data);
    } catch (err) {
      console.error("Failed to fetch communities:", err);
      setError("Unable to load communities. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, []);

  const handleCreateCommunity = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      await createCommunity({
        name: name.trim(),
        address: address.trim(),
      });

      setName("");
      setAddress("");
      setShowForm(false);

      await fetchCommunities();
    } catch (err) {
      console.error("Failed to create community:", err);
      setError("Unable to create community. Please check the details and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Communities">
      <div className="communities-header">
        <div>
          <h2>Community Management</h2>
          <p>Manage all registered communities on the platform.</p>
        </div>

        <button
          className="add-community-button"
          onClick={() => setShowForm(!showForm)}
        >
          + Add Community
        </button>
      </div>

      {error && <div className="communities-error">{error}</div>}

      {showForm && (
        <form
          className="community-form"
          onSubmit={handleCreateCommunity}
        >
          <h3>Add New Community</h3>

          <label htmlFor="community-name">Community Name</label>
          <input
            id="community-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter community name"
            required
          />

          <label htmlFor="community-address">Address</label>
          <textarea
            id="community-address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="Enter community address"
            required
          />

          <div className="community-form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => setShowForm(false)}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="submit-button"
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Create Community"}
            </button>
          </div>
        </form>
      )}

      <div className="communities-table-container">
        <div className="communities-table-heading">
          <h3>Registered Communities</h3>
          <span>{communities.length} communities</span>
        </div>

        {loading ? (
          <p className="communities-message">Loading communities...</p>
        ) : communities.length === 0 ? (
          <p className="communities-message">
            No communities registered yet.
          </p>
        ) : (
          <table className="communities-table">
            <thead>
              <tr>
                <th>Community Name</th>
                <th>Address</th>
              </tr>
            </thead>

            <tbody>
              {communities.map((community) => (
                <tr key={community.id}>
                  <td>{community.name}</td>
                  <td>{community.address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}

export default CommunitiesPage;
