import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuthStore from "../stores/Zustand.store";
import { getCompanyBasePathFallback } from "../utils/companyPaths";

/**
 * ProtectedRoute - Route protection component with authentication guard.
 * Redirects to current company home when unauthenticated (e.g. /jlg when on JLG).
 */
const ProtectedRoute = ({ children }) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const location = useLocation();
  const pathSegment = location.pathname.split('/')[1];
  const companyHome = pathSegment ? `/${pathSegment}` : getCompanyBasePathFallback();

  if (!accessToken) {
    return <Navigate to={companyHome} replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
