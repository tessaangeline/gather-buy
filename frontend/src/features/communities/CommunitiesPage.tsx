
import { useEffect, useState } from "react";
import axios from "axios";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  getCommunities,
  createCommunity,
  updateCommunity,
  deleteCommunity,
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
  const [editingCommunity, setEditingCommunity] =
  useState<Community | null>(null);

    const [editName, setEditName] = useState("");
    const [editAddress, setEditAddress] = useState("");
    const [editSubmitting, setEditSubmitting] = useState(false);

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

  // Open edit form with existing details
    const handleEditClick = (community: Community) => {
    setEditingCommunity(community);
    setEditName(community.name);
    setEditAddress(community.address);
    };

    // Save updated community details
    const handleUpdateCommunity = async (
    event: React.FormEvent<HTMLFormElement>
    ) => {
    event.preventDefault();

    if (!editingCommunity) return;

    try {
        setEditSubmitting(true);
        setError("");

        const updatedCommunity = await updateCommunity(
        editingCommunity.id,
        {
            name: editName.trim(),
            address: editAddress.trim(),
        }
        );

        setCommunities((currentCommunities) =>
        currentCommunities.map((community) =>
            community.id === editingCommunity.id
            ? updatedCommunity
            : community
        )
        );

        setEditingCommunity(null);
    } catch (err) {
        console.error("Failed to update community:", err);
        setError("Unable to update community. Please check the details.");
    } finally {
        setEditSubmitting(false);
    }
    };

    // Delete community
    const handleDeleteCommunity = async (community: Community) => {
    const confirmed = window.confirm(
        `Are you sure you want to permanently delete ${community.name}?`
    );

    if (!confirmed) return;

    try {
        setError("");

        await deleteCommunity(community.id);

        setCommunities((currentCommunities) =>
        currentCommunities.filter(
            (item) => item.id !== community.id
        )
        );

        if (editingCommunity?.id === community.id) {
        setEditingCommunity(null);
        }
    } catch (err) {
        console.error("Failed to delete community:", err);

        if (axios.isAxiosError(err)) {
        setError(
            err.response?.data?.detail ||
            "Unable to delete community."
        );
        } else {
        setError("Something went wrong while deleting the community.");
        }
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

        {editingCommunity && (
        <form
            className="community-form"
            onSubmit={handleUpdateCommunity}
        >
            <h3>Edit Community</h3>

            <label htmlFor="edit-community-name">Community Name</label>
            <input
            id="edit-community-name"
            type="text"
            value={editName}
            onChange={(event) => setEditName(event.target.value)}
            required
            />

            <label htmlFor="edit-community-address">Address</label>
            <textarea
            id="edit-community-address"
            value={editAddress}
            onChange={(event) => setEditAddress(event.target.value)}
            required
            />

            <div className="community-form-actions">
            <button
                type="button"
                className="cancel-button"
                onClick={() => setEditingCommunity(null)}
                disabled={editSubmitting}
            >
                Cancel
            </button>

            <button
                type="submit"
                className="submit-button"
                disabled={editSubmitting}
            >
                {editSubmitting ? "Saving..." : "Save Changes"}
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
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
            {communities.map((community) => (
                <tr key={community.id}>
                <td>{community.name}</td>
                <td>{community.address}</td>

                <td>
                    <div className="community-actions">
                    <button
                        className="edit-community-btn"
                        onClick={() => handleEditClick(community)}
                    >
                        Edit
                    </button>

                    <button
                        className="delete-community-btn"
                        onClick={() => handleDeleteCommunity(community)}
                    >
                        Delete
                    </button>
                    </div>
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

export default CommunitiesPage;

