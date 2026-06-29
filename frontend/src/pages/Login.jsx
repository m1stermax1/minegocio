import { useState } from "react";
import { loginUser } from "../services/authService";
import { Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      await loginUser({ email, password });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-base)",
        padding: "1rem",
      }}
    >
      <form
        onSubmit={handleLogin}
        className="card card-elevated"
        style={{ width: "100%", maxWidth: "28rem", display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <h2 className="page-title" style={{ textAlign: "center", marginBottom: "0.5rem" }}>
          Iniciar Sesión
        </h2>

        {error && <div className="alert alert-error">{error}</div>}

        <div>
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            disabled={loading}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            disabled={loading}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
          {loading ? "Ingresando..." : "Ingresar"}
        </button>

        <Link to="/register" style={{ textAlign: "center", color: "var(--primary)" }}>
          ¿No tenés cuenta? Registrate
        </Link>
      </form>
    </div>
  );
}