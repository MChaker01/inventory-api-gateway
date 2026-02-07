import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";
import Spinner from "./Spinner";

/**
 * GuestRoute Component
 *
 * Purpose: Protects authentication page (login) from logged-in users
 */

const GuestRoute = () => {
  const { user, isLoading } = useAuth();
  // If still checking auth → show loading spinner
  if (isLoading) {
    return <Spinner />;
  }

  // If user is logged in → redirect to home/watchlist
  if (user) {
    return <Navigate to="/" />;
  }

  // Step 3: If no user (guest), allow access to login/ page
  return <Outlet />;
};

export default GuestRoute;
