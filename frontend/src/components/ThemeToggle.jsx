import { FiSun, FiMoon } from "react-icons/fi";
import { useTheme } from "../hooks/useTheme.js";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="btn btn-secondary btn-block"
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
    >
      {isDark ? (
        <>
          <FiSun className="w-4 h-4" />
          <span>Modo claro</span>
        </>
      ) : (
        <>
          <FiMoon className="w-4 h-4" />
          <span>Modo oscuro</span>
        </>
      )}
    </button>
  );
}