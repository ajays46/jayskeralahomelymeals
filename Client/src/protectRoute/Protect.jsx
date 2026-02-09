import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuthStore from "../stores/Zustand.store";
import { getCompanyBasePathFallback } from "../utils/companyPaths";
import api from "../api/axios";

/**
 * ProtectedRoute - Route protection component with authentication guard.
 * Redirects to current company home when unauthenticated (e.g. /jlg when on JLG).
 * On refresh: accessToken is not persisted (memory only), so we allow user+isAuthenticated
 * and give a short window for refresh-token to run before redirecting.
 */
const ProtectedRoute = ({ children }) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();
  const pathSegment = location.pathname.split('/')[1];
  const companyHome = pathSegment ? `/${pathSegment}` : getCompanyBasePathFallback();

  const hasUserNoToken = !!(user && isAuthenticated && !accessToken);
  const [checkingSession, setCheckingSession] = useState(hasUserNoToken);

  // On refresh, store has user+isAuthenticated (persisted) but accessToken is null. Try refresh once.
  useEffect(() => {
    if (accessToken) {
      setCheckingSession(false);
      return;
    }
    if (!user || !isAuthenticated) {
      setCheckingSession(false);
      return;
    }
    setCheckingSession(true);
    api.post('/auth/refresh-token')
      .then((res) => {
        if (res.data?.accessToken) {
          setAccessToken(res.data.accessToken);
        }
      })
      .catch(() => { logout(); })
      .finally(() => { setCheckingSession(false); });
  }, [accessToken, user, isAuthenticated, setAccessToken, logout]);

  if (!accessToken) {
    if (user && isAuthenticated && checkingSession) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <p className="text-gray-600">Verifying session...</p>
        </div>
      );
    }
    if (user && isAuthenticated && !checkingSession) {
      return <Navigate to={companyHome} replace />;
    }
    return <Navigate to={companyHome} replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
