import React, { useEffect, useState } from "react";
import "../styles/Sidebar.css";
import { useTheme } from "../hooks/useTheme";
import { useNavigate } from "react-router-dom";
import {
  FiMenu,
  FiHome,
  FiMessageSquare,
  FiSettings,
  FiSun,
  FiMoon,
} from "react-icons/fi";

const Sidebar: React.FC = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(isTouch);
  }, []);

  const handleToggle = () => setIsOpen((prev) => !prev);

  const handleMouseEnter = () => {
    if (!isTouchDevice) setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (!isTouchDevice) setIsOpen(false);
  };

  return (
    <div
  className={`sidebar ${isOpen ? "open" : ""}`}
  onMouseEnter={handleMouseEnter}
  onMouseLeave={handleMouseLeave}
>
  <div className="top-section">
    <button className="icon-button" onClick={handleToggle}>
      <FiMenu size={22} />
    </button>

    <div className="nav-item" onClick={() => navigate("/")}>
      <FiHome size={20} />
      <span className="nav-label">Início</span>
    </div>

    <div className="nav-item" onClick={() => navigate("/chat")}>
      <FiMessageSquare size={20} />
      <span className="nav-label">Chat</span>
    </div>

    <div className="nav-item" onClick={toggleTheme}>
      {theme === "dark" ? <FiSun size={20} /> : <FiMoon size={20} />}
      <span className="nav-label">
        Tema {theme === "dark" ? "Claro" : "Escuro"}
      </span>
    </div>
  </div>

  <div className="bottom-section">
    <div className="nav-item">
      <FiSettings size={20} />
      <span className="nav-label"></span>
    </div>
  </div>
</div>

  );
};

export default Sidebar;
