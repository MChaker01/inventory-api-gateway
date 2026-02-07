import { Routes, Route } from "react-router-dom";
import GuestRoute from "./components/GuestRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import HistoriqueStock from "./pages/HistoriqueStock";

function App() {
  return (
    <>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HistoriqueStock />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
