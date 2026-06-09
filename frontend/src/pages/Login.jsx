import { useState } from "react";
import { loginUser } from "../services/authService";
import { Link } from "react-router-dom";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();

        console.log("Logging in with:", { email, password });

        try {
            await loginUser({
                email,
                password,
            });

            alert("Login correcto");
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <form onSubmit={handleLogin}>
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

            <button type="submit">
                Ingresar
            </button>
            <Link to="/register">
                <button type="button">
                    Registrarse
                </button>
            </Link>
        </form>
    );
}