import InventoryPage from './pages/InventoryPage.jsx';
import './styles.css';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import {supabase} from './services/supabase.js';
import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from "react-router-dom";

function App() {
  const [user, setUser] = useState(null);
  

  useEffect(() => {
    // Usuario ya logueado
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    // Escuchar login/logout
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // if (!user) {
  //   return <Login />;
  // }

   return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? <Navigate to="/" /> : <Login />
        }
      />

      <Route
        path="/register"
        element={
          user ? <Navigate to="/" /> : <Register />
        }
      />

      <Route
        path="/"
        element={
          user ? <InventoryPage /> : <Navigate to="/login" />
        }
      />
    </Routes>
    );
}

export default App;
