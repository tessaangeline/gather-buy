
import { useEffect, useState } from "react";
import axios from "axios";

import DashboardLayout from "../../components/layout/DashboardLayout";

import {
  getSuppliers,
  createSupplier,
  updateSupplierStatus,
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
                      <label className="status-toggle">
                        <input
                          type="checkbox"
                          checked={supplier.is_active}
                          onChange={() =>
                            handleStatusChange(supplier)
                          }
                          aria-label={`Change status for ${supplier.full_name}`}
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
