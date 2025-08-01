// DarkModeToggle.jsx
import { useState, useEffect } from "react";

function DarkModeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detectar preferencia o modo guardado
  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode");
    
    if (savedMode !== null) {
      // Si hay una preferencia guardada, usarla
      setIsDarkMode(savedMode === "true");
    } else {
      // Si no hay preferencia guardada, usar la del sistema
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      setIsDarkMode(mediaQuery.matches);
      
      // Escuchar cambios en la preferencia del sistema solo si no hay preferencia manual
      const handler = (e) => {
        if (localStorage.getItem("darkMode") === null) {
          setIsDarkMode(e.matches);
        }
      };

      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, []);

  // Aplicar clase al <html> y data-theme
  useEffect(() => {
    const root = document.documentElement;
    
    if (isDarkMode) {
      root.classList.add("dark-mode");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark-mode");
      root.setAttribute("data-theme", "light");
    }
  }, [isDarkMode]);

  // Alternar modo y guardar
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("darkMode", newMode.toString());
  };

  // Función para resetear a preferencia del sistema
  const resetToSystem = () => {
    localStorage.removeItem("darkMode");
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDarkMode(mediaQuery.matches);
  };

  return (
    <div className="dark-mode-controls">
      <button
        className="dark-mode-toggle"
        onClick={toggleDarkMode}
        title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        aria-label="Cambiar tema"
      >
        {isDarkMode ? "☀️" : "🌙"}
      </button>
    </div>
  );
}

export default DarkModeToggle;