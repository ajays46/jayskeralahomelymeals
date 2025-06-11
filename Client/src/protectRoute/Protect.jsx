import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "../stores/Zustand.store";

const ProtectedRoute = ({ children }) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
