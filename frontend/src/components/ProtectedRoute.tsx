import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";
import Spinner from "./Spinner";

const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();

  // Step 1: If still checking auth, show loading
  if (isLoading) {
    return <Spinner />;
  }

  // Step 2: If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Step 3: If user exists, render the protected page
  return <Outlet />;
};

export default ProtectedRoute;
