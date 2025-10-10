import React from "react";
import Sidebar from "../components/Sidebar";
import "../styles/Sidebar.css";

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="main-layout">
      <Sidebar />
      <div className="content">{children}</div>
    </div>
  );
};
