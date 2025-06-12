import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Sidebar from "../components/Sidebar";
import "../styles/Home.css";

const Home: React.FC = () => {
  const navigate = useNavigate();

  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  };

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  return (
    <div className="home-container">
      <Sidebar />
      <main className="home-content">
        <motion.div
          className="welcome-card"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
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
        </motion.div>

        <motion.div
          className="examples-section"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
        >
          <h2>Exemplos de Perguntas</h2>
          <div className="examples-grid">
            {[
              "Como estruturar um EIA para um loteamento?",
              "Quais documentos são exigidos no licenciamento prévio?",
              "Quando um RIMA é necessário e como elaborá-lo?",
            ].map((text, index) => (
<motion.div
  className="example-card"
  key={index}
  variants={fadeInUp}
  initial="hidden"
  animate="visible"
  whileHover={{ scale: 1.02, x: 6, boxShadow: "0 6px 20px rgba(0, 0, 0, 0.15)" }}
  transition={{ delay: 0.7 + index * 0.2, duration: 0.3 }}
>
  <p>{text}</p>
</motion.div>

            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Home;
