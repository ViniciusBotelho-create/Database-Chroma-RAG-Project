// src/pages/chat.tsx
import React, { useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import PromptInput from "../components/PromptInput";
import "../styles/Chat.css";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
}

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: text,
      role: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    scrollToBottom();

    try {
      const res = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input: text }),
      });

      if (!res.ok) throw new Error("Erro ao obter resposta do servidor");

      const data = await res.json();

      // A resposta vem como [resposta, contexto]
      const [answer, context] = data.response;

      const botMessage: Message = {
        id: crypto.randomUUID(),
        content: answer,
        role: "assistant",
      };

      setMessages((prev) => [...prev, botMessage]);

      // (Opcional) Exibir o contexto abaixo da resposta
      if (context) {
        const contextMessage: Message = {
          id: crypto.randomUUID(),
          content: `🔍 *Contexto usado:*\n${context}`,
          role: "assistant",
        };
        setMessages((prev) => [...prev, contextMessage]);
      }

    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        content: "❌ Erro ao se comunicar com o servidor.",
        role: "assistant",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      chatRef.current?.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 50);
  };

  return (
    <div className="chat-page">
      <Sidebar />
      <div className="chat-window-container">
        <div className="chat-window" ref={chatRef}>
          <ChatWindow messages={messages} />
        </div>
        <PromptInput onSend={handleSend} onAfterSendScroll={scrollToBottom} />
      </div>
    </div>
  );
};

export default ChatPage;
