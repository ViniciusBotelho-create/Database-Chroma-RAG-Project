import React, { useEffect, useState } from "react";
import "../styles/Sidebar.css";
import { Home, MessageCircle, Settings, Sun, Moon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const Sidebar: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "dark"
  );

  const location = useLocation();

  // mover página ao expandir sidebar
  useEffect(() => {
    if (isExpanded) {
      document.body.classList.add("sidebar-open");
    } else {
      document.body.classList.remove("sidebar-open");
    }
  }, [isExpanded]);

  // tema
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <aside
      className={`sidebar ${isExpanded ? "expanded" : ""}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="sidebar-content">

        <Link
          to="/"
          className={`sidebar-item ${location.pathname === "/" ? "active" : ""}`}
        >
          <Home size={22} />
          <span className={`sidebar-label ${isExpanded ? "show" : ""}`}>Início</span>
        </Link>

        <Link
          to="/chat"
          className={`sidebar-item ${location.pathname === "/chat" ? "active" : ""}`}
        >
          <MessageCircle size={22} />
          <span className={`sidebar-label ${isExpanded ? "show" : ""}`}>Chat</span>
        </Link>

        <Link
          to="/config"
          className={`sidebar-item ${location.pathname === "/config" ? "active" : ""}`}
        >
          <Settings size={22} />
          <span className={`sidebar-label ${isExpanded ? "show" : ""}`}>Configurações</span>
        </Link>

        <button
          className="sidebar-item theme-toggle"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun size={22} /> : <Moon size={22} />}
          <span className={`sidebar-label ${isExpanded ? "show" : ""}`}>
            {theme === "dark" ? "Modo Claro" : "Modo Escuro"}
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
