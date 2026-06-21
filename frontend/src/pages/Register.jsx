import { useState } from "react";
import { registerUser } from "../services/authService";
import { Link } from "react-router-dom";

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [name, setName] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    if (loading) return; // 👈 evita doble submit
    setLoading(true);
    console.log("REGISTER USER CALL");

    try {
      await registerUser({
        name: name,
        email,
        password,
        businessName,
      });

      alert("Cuenta creada");
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 p-4">
      <form
        onSubmit={handleRegister}
        className="w-full max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg border border-gray-100 flex flex-col gap-4"
      >
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Crear Cuenta
        </h2>

        <input
          placeholder="Nombre de Usuario"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />

        <input
          placeholder="Nombre del negocio"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </button>

        <Link
          to="/login"
          className="text-center text-blue-600 hover:text-blue-700 font-medium transition"
        >
          ¿Ya tenés cuenta? Iniciá sesión
        </Link>
      </form>
    </div>
  );
}
