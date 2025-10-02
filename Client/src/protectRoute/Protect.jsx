import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "../stores/Zustand.store";

/**
 * ProtectedRoute - Route protection component with authentication guard
 * Handles route protection based on user authentication status
 * Features: Authentication checking, automatic redirect, outlet rendering
 */
const ProtectedRoute = ({ children }) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  

  if (!accessToken) {
    return <Navigate to="/" replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
