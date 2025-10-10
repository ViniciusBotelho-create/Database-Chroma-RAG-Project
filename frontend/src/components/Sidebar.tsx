import React, { useEffect, useState } from "react";
import "../styles/Sidebar.css";
import { Home, MessageCircle, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const Sidebar: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();

  useEffect(() => {
    document.body.classList.toggle("sidebar-expanded", isExpanded);
  }, [isExpanded]);

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
          {isExpanded && <span>Início</span>}
        </Link>

        <Link
          to="/chat"
          className={`sidebar-item ${location.pathname === "/chat" ? "active" : ""}`}
        >
          <MessageCircle size={22} />
          {isExpanded && <span>Chat</span>}
        </Link>

        <Link
          to="/config"
          className={`sidebar-item ${location.pathname === "/config" ? "active" : ""}`}
        >
          <Settings size={22} />
          {isExpanded && <span>Configurações</span>}
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
