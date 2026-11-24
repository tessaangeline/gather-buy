
import { useEffect, useState } from "react";
import axios from "axios";

import DashboardLayout from "../../components/layout/DashboardLayout";

import {
  getSuppliers,
  createSupplier,
  updateSupplierStatus,
  updateUser,
  deleteUser,
  type Supplier,
} from "./userService";

import "./SuppliersPage.css";

function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);

    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [editFullName, setEditFullName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editSubmitting, setEditSubmitting] = useState(false);  

  // Fetch existing Supplier accounts
  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error("Failed to fetch suppliers:", err);
      setError("Unable to load Supplier accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Create a Supplier account
  const handleCreateSupplier = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      const newSupplier = await createSupplier({
        full_name: fullName,
        email,
        password,
        role: "SUPPLIER",
      });

      setSuppliers([newSupplier]);

      setFullName("");
      setEmail("");
      setPassword("");

      setShowForm(false);
    } catch (err) {
      console.error("Failed to create supplier:", err);

      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.detail;

        setError(
          message || "Unable to create Supplier account."
        );
      } else {
        setError("Something went wrong while creating the Supplier.");
      }

      // Refresh the list in case another request created
      // the Supplier at the same time.
      await fetchSuppliers();
    } finally {
      setSubmitting(false);
    }
  };

  // Open the edit form with the Supplier's current details
    const handleEditClick = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setEditFullName(supplier.full_name);
    setEditEmail(supplier.email);
    };

    // Update Supplier details
    const handleUpdateSupplier = async (
    event: React.FormEvent<HTMLFormElement>
    ) => {
    event.preventDefault();

    if (!editingSupplier) return;

    try {
        setEditSubmitting(true);
        setError("");

        const updatedSupplier = await updateUser(editingSupplier.id, {
        full_name: editFullName.trim(),
        email: editEmail.trim(),
        });

        setSuppliers((currentSuppliers) =>
        currentSuppliers.map((supplier) =>
            supplier.id === editingSupplier.id
            ? { ...supplier, ...updatedSupplier }
            : supplier
        )
        );

        setEditingSupplier(null);
    } catch (err) {
        console.error("Failed to update Supplier:", err);
        setError("Unable to update Supplier details. Please check the information.");
    } finally {
        setEditSubmitting(false);
    }
    };

    // Permanently delete Supplier account
    const handleDeleteSupplier = async (supplier: Supplier) => {
    const confirmed = window.confirm(
        `Are you sure you want to permanently delete ${supplier.full_name}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
        setError("");

        await deleteUser(supplier.id);

        setSuppliers((currentSuppliers) =>
        currentSuppliers.filter((item) => item.id !== supplier.id)
        );

        setEditingSupplier(null);
        setShowForm(false);
    } catch (err) {
        console.error("Failed to delete Supplier:", err);
        setError("Unable to delete Supplier account.");
    }
    };

  // Activate or deactivate the Supplier
  const handleStatusChange = async (supplier: Supplier) => {
    try {
      setError("");

      const newStatus = !supplier.is_active;

      await updateSupplierStatus(supplier.id, newStatus);

      setSuppliers((currentSuppliers) =>
        currentSuppliers.map((item) =>
          item.id === supplier.id
            ? { ...item, is_active: newStatus }
            : item
        )
      );
    } catch (err) {
      console.error("Failed to update Supplier status:", err);
      setError("Unable to update Supplier status.");
    }
  };

  const supplierExists = suppliers.length > 0;

  return (
    <DashboardLayout title="Supplier Management">
      <div className="suppliers-page">

        <div className="suppliers-header">
          <div>
            <h1>Suppliers</h1>
            <p>Manage the Supplier account for Gather Buy.</p>
          </div>

          <button
            className="add-supplier-btn"
            disabled={supplierExists || loading}
            onClick={() => setShowForm(!showForm)}
            title={
                supplierExists
                ? "A Supplier account already exists"
                : "Create a Supplier account"
            }
            >
            {showForm ? "Cancel" : "+ Add Supplier"}
            </button>


        </div>

        {error && (
          <div className="suppliers-error">
            {error}
          </div>
        )}

        {showForm && !supplierExists && (
          <form
            className="supplier-form"
            onSubmit={handleCreateSupplier}
            autoComplete="off"
          >
            <h2>Create Supplier Account</h2>

            <div className="supplier-form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter Supplier name"
                required
              />
            </div>

            <div className="supplier-form-group">
              <label>Email</label>
              <input
                type="email"
                name="new-supplier-email"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                required
              />
            </div>

            <div className="supplier-form-group">
              <label>Password</label>
              <input
                type="password"
                name="new-supplier-password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>

            <button
              type="submit"
              className="submit-supplier-btn"
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Create Supplier"}
            </button>
          </form>
        )}

        {editingSupplier && (
        <form
            className="supplier-form"
            onSubmit={handleUpdateSupplier}
            autoComplete="off"
        >
            <h2>Edit Supplier Details</h2>

            <div className="supplier-form-group">
            <label>Full Name</label>
            <input
                type="text"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                required
            />
            </div>

            <div className="supplier-form-group">
            <label>Email</label>
            <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                required
            />
            </div>

            <button
            type="submit"
            className="submit-supplier-btn"
            disabled={editSubmitting}
            >
            {editSubmitting ? "Saving..." : "Save Changes"}
            </button>

            <button
            type="button"
            onClick={() => setEditingSupplier(null)}
            >
            Cancel
            </button>
        </form>
        )}

        <div className="suppliers-table-container">
          <h2>Supplier Details</h2>

          {loading ? (
            <p>Loading Supplier details...</p>
          ) : suppliers.length === 0 ? (
            <div className="suppliers-empty">
              <p>No Supplier account has been created yet.</p>
              <p>You can create one using the Add Supplier button.</p>
            </div>
          ) : (
            <table className="suppliers-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Account Management</th>
                </tr>
              </thead>

              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td>{supplier.full_name}</td>
                    <td>{supplier.email}</td>
                    <td>
                      <span
                        className={
                          supplier.is_active
                            ? "supplier-status active"
                            : "supplier-status inactive"
                        }
                      >
                        {supplier.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                        <div className="supplier-actions">
                            <label className="status-toggle">
                            <input
                                type="checkbox"
                                checked={supplier.is_active}
                                onChange={() => handleStatusChange(supplier)}
                                aria-label={`Change status for ${supplier.full_name}`}
                            />
                            <span className="toggle-slider"></span>
                            </label>

                            <button
                            className="edit-supplier-btn"
                            onClick={() => handleEditClick(supplier)}
                            >
                            Edit
                            </button>

                            <button
                            className="delete-supplier-btn"
                            onClick={() => handleDeleteSupplier(supplier)}
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

        {supplierExists && (
          <p className="supplier-limit-note">
            Only one Supplier account is allowed in Gather Buy.
            Deactivating this account will not allow another Supplier
            to be created.
          </p>
        )}

      </div>
    </DashboardLayout>
  );
}

export default SuppliersPage;
