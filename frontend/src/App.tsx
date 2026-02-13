import { Routes, Route } from "react-router-dom";
import GuestRoute from "./components/GuestRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import Login from "./pages/Login";
import HistoriqueStock from "./pages/HistoriqueStock";
import SessionDetails from "./pages/SessionDetails";

function App() {
  return (
    <>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<HistoriqueStock />} />
            <Route path="/session/:id" element={<SessionDetails />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;
