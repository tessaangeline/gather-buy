
import { useEffect, useMemo, useState, type FormEvent } from "react";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import {
  getResidents,
  createResident,
  updateResident,
  updateResidentStatus,
  type Resident,
} from "./residentService";
import "./ResidentsPage.css";

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type SortOption = "NAME" | "FLAT";

interface ResidentForm {
  full_name: string;
  email: string;
  password: string;
  flat_number: string;
}

const emptyForm: ResidentForm = {
  full_name: "",
  email: "",
  password: "",
  flat_number: "",
};

function ResidentsPage() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("NAME");

  const [showModal, setShowModal] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [form, setForm] = useState<ResidentForm>(emptyForm);

  // Fetch residents from the backend
  const fetchResidents = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getResidents();
      setResidents(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Unable to load residents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResidents();
  }, []);

  // Search, filter and sort residents
  const filteredResidents = useMemo(() => {
    return residents
      .filter((resident) => {
        const value = search.toLowerCase().trim();

        const matchesSearch =
          resident.full_name.toLowerCase().includes(value) ||
          resident.email.toLowerCase().includes(value) ||
          (resident.flat_number || "").toLowerCase().includes(value);

        const matchesStatus =
          statusFilter === "ALL" ||
          (statusFilter === "ACTIVE" && resident.is_active) ||
          (statusFilter === "INACTIVE" && !resident.is_active);

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "NAME") {
          return a.full_name.localeCompare(b.full_name);
        }

        return (a.flat_number || "").localeCompare(
          b.flat_number || "",
          undefined,
          { numeric: true, sensitivity: "base" }
        );
      });
  }, [residents, search, statusFilter, sortBy]);

  const activeCount = residents.filter((r) => r.is_active).length;
  const inactiveCount = residents.length - activeCount;

  // Open Add Resident modal
  const openAddModal = () => {
    setEditingResident(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  // Open Edit Resident modal
  const openEditModal = (resident: Resident) => {
    setEditingResident(resident);

    setForm({
      full_name: resident.full_name,
      email: resident.email,
      password: "",
      flat_number: resident.flat_number || "",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingResident(null);
    setForm(emptyForm);
    setError("");
  };

  // Create or update resident
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !form.full_name.trim() ||
      !form.email.trim() ||
      !form.flat_number.trim()
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!editingResident && form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    try {
      setSaving(true);

      if (editingResident) {
        await updateResident(editingResident.id, {
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          flat_number: form.flat_number.trim(),
        });

        setSuccess("Resident details updated successfully.");
      } else {
        await createResident({
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: "RESIDENT",
          flat_number: form.flat_number.trim(),
        });

        setSuccess("Resident added successfully.");
      }

      await fetchResidents();

      setShowModal(false);
      setEditingResident(null);
      setForm(emptyForm);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Something went wrong. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // Activate or deactivate resident
  const handleStatusChange = async (resident: Resident) => {
    const action = resident.is_active ? "deactivate" : "activate";

    if (
      !window.confirm(
        `Are you sure you want to ${action} ${resident.full_name}?`
      )
    ) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await updateResidentStatus(resident.id, !resident.is_active);

      setSuccess(`Resident ${action}d successfully.`);

      await fetchResidents();
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Unable to update resident status."
      );
    }
  };

  return (
    <DashboardLayout title="Residents">
      <div className="residents-page">

        {/* Page Header */}
        <div className="residents-header">
          <div>
            <h1>Residents Management</h1>
            <p>Manage residents in your community.</p>
          </div>

          <button
            className="add-resident-btn"
            onClick={openAddModal}
          >
            + Add Resident
          </button>
        </div>

        {/* Summary Cards */}
        <div className="resident-stats">
          <div className="resident-stat-card">
            <span>Total Residents</span>
            <strong>{residents.length}</strong>
          </div>

          <div className="resident-stat-card">
            <span>Active Residents</span>
            <strong>{activeCount}</strong>
          </div>

          <div className="resident-stat-card">
            <span>Inactive Residents</span>
            <strong>{inactiveCount}</strong>
          </div>
        </div>

        {success && (
          <div className="residents-success">{success}</div>
        )}

        {error && !showModal && (
          <div className="residents-error">{error}</div>
        )}

        {/* Residents Table */}
        <div className="residents-table-card">

          {/* Search, Filter and Sort */}
          <div className="residents-toolbar">
            <input
              type="text"
              placeholder="Search by name, email or flat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as StatusFilter)
              }
            >
              <option value="ALL">All Residents</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as SortOption)
              }
            >
              <option value="NAME">Sort: Name (A–Z)</option>
              <option value="FLAT">Sort: Flat Number</option>
            </select>
          </div>

          {/* Loading and Empty States */}
          {loading ? (
            <div className="residents-message">
              Loading residents...
            </div>
          ) : filteredResidents.length === 0 ? (
            <div className="residents-message">
              {residents.length === 0
                ? "No residents have been added yet."
                : "No residents match your search."}
            </div>
          ) : (
            <div className="residents-table-wrapper">
              <table className="residents-table">
                <thead>
                  <tr>
                    <th>Resident</th>
                    <th>Email</th>
                    <th>Flat Number</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredResidents.map((resident) => (
                    <tr key={resident.id}>
                      <td className="resident-name">
                        {resident.full_name}
                      </td>

                      <td>{resident.email}</td>

                      <td>{resident.flat_number || "—"}</td>

                      <td>
                        <span
                          className={`resident-status ${
                            resident.is_active
                              ? "active"
                              : "inactive"
                          }`}
                        >
                          {resident.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td>
                        <button
                          className="resident-action-btn"
                          onClick={() => openEditModal(resident)}
                        >
                          Edit
                        </button>

                        <button
                          className={`resident-action-btn ${
                            resident.is_active
                              ? "deactivate-btn"
                              : "activate-btn"
                          }`}
                          onClick={() =>
                            handleStatusChange(resident)
                          }
                        >
                          {resident.is_active
                            ? "Deactivate"
                            : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add / Edit Modal */}
        {showModal && (
          <div
            className="resident-modal-overlay"
            onClick={closeModal}
          >
            <div
              className="resident-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="resident-modal-header">
                <div>
                  <h2>
                    {editingResident
                      ? "Edit Resident"
                      : "Add Resident"}
                  </h2>

                  <p>
                    {editingResident
                      ? "Update resident account details."
                      : "Create a new resident account for your community."}
                  </p>
                </div>

                <button
                  className="modal-close-btn"
                  onClick={closeModal}
                  type="button"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <label>Full Name *</label>

                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      full_name: e.target.value,
                    })
                  }
                  placeholder="Enter full name"
                  required
                />

                <label>Email Address *</label>

                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value,
                    })
                  }
                  placeholder="Enter email address"
                  required
                />

                {!editingResident && (
                  <>
                    <label>Password *</label>

                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          password: e.target.value,
                        })
                      }
                      placeholder="Minimum 8 characters"
                      minLength={8}
                      required
                    />
                  </>
                )}

                <label>Flat Number *</label>

                <input
                  type="text"
                  value={form.flat_number}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      flat_number: e.target.value,
                    })
                  }
                  placeholder="e.g. A-204"
                  required
                />

                {error && (
                  <div className="residents-error modal-error">
                    {error}
                  </div>
                )}

                <div className="resident-modal-actions">
                  <button
                    type="button"
                    className="modal-cancel-btn"
                    onClick={closeModal}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="modal-submit-btn"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : editingResident
                      ? "Save Changes"
                      : "Create Resident"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default ResidentsPage;
