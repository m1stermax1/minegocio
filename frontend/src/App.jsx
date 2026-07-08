import InventoryPage from "./pages/InventoryPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ProvidersPage from "./pages/ProvidersPage.jsx";
import SalesPage from "./pages/SalesPage.jsx";
import PaymentsPage from "./pages/PaymentsPage.jsx";
import BillingsPage from "./pages/BillingsPage.jsx";
import SafePage from "./pages/safePage.jsx";

import "./styles.css";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import { supabase } from "./services/supabase.js";
import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { getProfile } from "./services/users.js";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Usuario ya logueado
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);

      const profileData = async (datauser = data.user) => {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", datauser.id).single();
        return data;
      };
    });

    // Escuchar login/logout
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />

      <Route
        path="/register"
        element={user ? <Navigate to="/" /> : <Register />}
      />

      <Route
        path="/"
        element={user ? <DashboardPage /> : <Navigate to="/login" />}
      />

      <Route
        path="/inventory"
        element={user ? <InventoryPage /> : <Navigate to="/login" />}
      />

      <Route
        path="/providers"
        element={user ? <ProvidersPage /> : <Navigate to="/login" />}
      />

      <Route
        path="/sales"
        element={user ? <SalesPage /> : <Navigate to="/login" />}
      />

      <Route
        path="/payments"
        element={user ? <PaymentsPage /> : <Navigate to="/login" />}
      />

      <Route
        path="/safe"
        element={user ? <SafePage /> : <Navigate to="/login" />}
      />

      <Route
        path="/billings"
        element={user ? <BillingsPage /> : <Navigate to="/login" />}
      />
    </Routes>
  );
}

export default App;
