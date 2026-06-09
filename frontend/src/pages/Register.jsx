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
        try {
            console.log("Registering user with:", { name, email, password, businessName });
            await registerUser({
                name,
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
        <form onSubmit={handleRegister}>
            <input
                placeholder="Nombre de Usuario"
                value={name}
                onChange={(e) =>
                    setName(e.target.value)
                }
            />

            <input
                placeholder="Nombre del negocio"
                value={businessName}
                onChange={(e) =>
                    setBusinessName(e.target.value)
                }
            />

            <input
                placeholder="Email"
                value={email}
                onChange={(e) =>
                    setEmail(e.target.value)
                }
            />

            <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) =>
                    setPassword(e.target.value)
                }
            />

            <button type="submit" disabled={loading}>
                {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
            <Link to="/login">
                Ya tenes cuenta? Inicia sesion
            </Link>
        </form>
    );
}