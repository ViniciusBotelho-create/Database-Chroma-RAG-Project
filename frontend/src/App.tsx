import { useState } from "react";
import "./App.css";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
}

function App() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuestion(e.target.value);
  };

  const handleSubmit = async () => {
    if (!question.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: question,
      sender: "user",
    };

    // Adiciona a mensagem do usuário ao array
    setMessages((prev) => [...prev, userMessage]);

    try {
      const res = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input: question }),
      });

      if (!res.ok) {
        throw new Error(`Erro na requisição: ${res.status}`);
      }

      const data = await res.json();

      const botMessage: Message = {
        id: Date.now(),
        text: data.response || "Nenhuma resposta encontrada.",
        sender: "bot",
      };

      setMessages((prev) => [...prev, botMessage]);

    } catch (error) {
      console.error("Erro ao enviar a pergunta:", error);

      const errorMessage: Message = {
        id: Date.now(),
        text: "Ocorreu um erro ao processar a solicitação.",
        sender: "bot",
      };

      setMessages((prev) => [...prev, errorMessage]);
    }

    setQuestion("");
  };

  return (
    <div className="App">
      <h1>Chat RAG - Pergunte sobre EIA/RIMA</h1>

      <div className="message-container">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${msg.sender === "user" ? "user-message" : "bot-message"}`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <div className="input-group">
        <input
          type="text"
          value={question}
          onChange={handleInputChange}
          placeholder="Digite sua pergunta aqui..."
        />
        <button onClick={handleSubmit}>Enviar</button>
      </div>
    </div>
  );
}

export default App;
