
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import LoginPage from "../features/auth/LoginPage";
import ProtectedRoute from "../features/auth/ProtectedRoute";
import SuperAdminDashboard from "../features/dashboard/SuperAdminDashboard";
import CommunitiesPage from "../features/communities/CommunitiesPage";
import ApartmentAdminsPage from "../features/users/ApartmentAdminsPage";
import SuppliersPage from "../features/users/SuppliersPage";
import ProductsPage from "../features/supplier/products/ProductsPage";
import SupplierDashboard from "../features/supplier/dashboard/SupplierDashboard";
import OrdersPage from "../features/supplier/orders/OrdersPage";


import type { User } from "../features/auth/authService";



function getDashboardPath(role: User["role"]): string {
  const paths: Record<User["role"], string> = {
    SUPER_ADMIN: "/super-admin/dashboard",
    APARTMENT_ADMIN: "/apartment-admin/dashboard",
    SUPPLIER: "/supplier/dashboard",
    RESIDENT: "/resident/dashboard",
  };

  return paths[role];
}

function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) return <p>Checking your session...</p>;

  return (
    <Navigate
      to={user ? getDashboardPath(user.role) : "/login"}
      replace
    />
  );
}

function LoginRoute() {
  const { user, loading } = useAuth();

  if (loading) return <p>Checking your session...</p>;

  if (user) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return <LoginPage />;
}

// Temporary page until we build the real dashboards
function DashboardPlaceholder() {
  const { user, logout } = useAuth();

  return (
    <main style={{ padding: "40px" }}>
      <h1>Welcome to Gather Buy</h1>
      <p>Hello, {user?.full_name}!</p>
      <p>Your role: {user?.role}</p>

      <button onClick={logout}>Logout</button>
    </main>
  );
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginRoute />} />

        <Route
            path="/super-admin/dashboard"
            element={
                <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                <SuperAdminDashboard />
                </ProtectedRoute>
            }
            />

        <Route
            path="/super-admin/communities"
            element={
                <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                <CommunitiesPage />
                </ProtectedRoute>
            }
            />

        <Route
            path="/super-admin/admins"
            element={
                <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                <ApartmentAdminsPage />
                </ProtectedRoute>
            }
            />

        <Route
            path="/super-admin/suppliers"
            element={
                <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                <SuppliersPage />
                </ProtectedRoute>
            }
            />

        <Route
          path="/apartment-admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["APARTMENT_ADMIN"]}>
              <DashboardPlaceholder />
            </ProtectedRoute>
          }
        />

        <Route
          path="/supplier/dashboard"
          element={
            <ProtectedRoute allowedRoles={["SUPPLIER"]}>
              <SupplierDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/supplier/products"
          element={
            <ProtectedRoute allowedRoles={["SUPPLIER"]}>
              <ProductsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/supplier/orders"
          element={
            <ProtectedRoute allowedRoles={["SUPPLIER"]}>
              <OrdersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/resident/dashboard"
          element={
            <ProtectedRoute allowedRoles={["RESIDENT"]}>
              <DashboardPlaceholder />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
