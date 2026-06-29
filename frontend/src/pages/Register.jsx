import { useState } from "react";
import { registerUser } from "../services/authService";
import { Link } from "react-router-dom";

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      await registerUser({ name, email, password, businessName });
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
        onSubmit={handleRegister}
        className="card card-elevated"
        style={{ width: "100%", maxWidth: "28rem", display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <h2 className="page-title" style={{ textAlign: "center", marginBottom: "0.5rem" }}>
          Crear Cuenta
        </h2>

        {error && <div className="alert alert-error">{error}</div>}

        <div>
          <label className="label" htmlFor="name">Nombre de Usuario</label>
          <input
            id="name"
            placeholder="Ej: María"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            disabled={loading}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="business">Nombre del negocio</label>
          <input
            id="business"
            placeholder="Ej: Lila Feria Americana"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="input"
            disabled={loading}
            required
          />
        </div>

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
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </button>

        <Link to="/login" style={{ textAlign: "center", color: "var(--primary)" }}>
          ¿Ya tenés cuenta? Iniciá sesión
        </Link>
      </form>
    </div>
  );
}