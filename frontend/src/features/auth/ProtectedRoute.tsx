
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import type { User } from "./authService";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: User["role"][];
}

function getDashboardPath(role: User["role"]): string {
  const paths: Record<User["role"], string> = {
    SUPER_ADMIN: "/super-admin/dashboard",
    APARTMENT_ADMIN: "/apartment-admin/dashboard",
    SUPPLIER: "/supplier/dashboard",
    RESIDENT: "/resident/dashboard",
  };

  return paths[role];
}

function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p>Checking your session...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <Navigate to={getDashboardPath(user.role)} replace />
    );
  }

  return <>{children}</>;
}

export default ProtectedRoute;
