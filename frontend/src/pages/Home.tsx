import React from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "../styles/Home.css";

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <Sidebar />
      <main className="home-content">
        <div className="welcome-card">
          <h1 className="title">Assistente Ambiental IA</h1>
          <p className="subtitle">
            Sua IA especializada em documentos de licenciamento ambiental.
            Esclareça dúvidas, entenda processos e produza documentos como EIA
            e RIMA com mais eficiência.
          </p>
          <button
            className="start-button"
            onClick={() => navigate("/chat")}
          >
            Começar Agora
          </button>
        </div>

        <div className="examples-section">
          <h2>Exemplos de Perguntas</h2>
          <div className="examples-grid">
            <div className="example-card">
              <p>Como estruturar um EIA para um loteamento?</p>
            </div>
            <div className="example-card">
              <p>Quais documentos são exigidos no licenciamento prévio?</p>
            </div>
            <div className="example-card">
              <p>Quando um RIMA é necessário e como elaborá-lo?</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
