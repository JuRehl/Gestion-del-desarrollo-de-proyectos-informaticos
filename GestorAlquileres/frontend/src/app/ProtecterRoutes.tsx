import { Navigate, Outlet } from "react-router";

interface ProtectedRouteProps {
  allowedRoles: string[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const token = localStorage.getItem("auth_token");
  const userStr = localStorage.getItem("auth_user");

  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userStr);

  if (!allowedRoles.includes(user.rol)) {
    if (user.rol === "INQ") {
      return <Navigate to="/mis-edificios" replace />;
    }
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}