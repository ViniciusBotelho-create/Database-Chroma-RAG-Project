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
  const [firstMessageSent, setFirstMessageSent] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const handleSend = async (text: string) => {
    if (!firstMessageSent) setFirstMessageSent(true);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: text,
      role: "user",
    };
    setMessages((prev) => [...prev, userMessage]);
    scrollToBottom();

    try {
      const res = await fetch("http://localhost:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: text }),
      });

      if (!res.ok) throw new Error("Erro ao obter resposta do servidor");

      const data = await res.json();
      const { answer, refs, images } = data; // destruturação correta

      // Mensagem principal do bot
      if (answer) {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), content: answer, role: "assistant" },
        ]);
      }

      // Mensagem de referências
      if (refs) {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), content: `📚 Fontes:\n${refs}`, role: "assistant" },
        ]);
      }

      // Mensagem de imagens
      if (images) {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), content: `🖼️ Imagens relacionadas:\n${images}`, role: "assistant" },
        ]);
      }

    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), content: "Erro ao se comunicar com o servidor.", role: "assistant" },
      ]);
    } finally {
      scrollToBottom();
    }
  };

  // Para LLM direta, se quiser usar futuramente
  const handleLLMSend = async (text: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: text,
      role: "user",
    };
    setMessages((prev) => [...prev, userMessage]);
    scrollToBottom();

    try {
      const res = await fetch("http://localhost:8000/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: text }),
      });

      if (!res.ok) throw new Error("Erro ao obter resposta da LLM");

      const data = await res.json();
      const botMessage: Message = {
        id: crypto.randomUUID(),
        content: data.answer,
        role: "assistant",
      };
      setMessages((prev) => [...prev, botMessage]);

    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), content: "Erro ao se comunicar com a LLM.", role: "assistant" },
      ]);
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
        <PromptInput
          onSend={handleSend}
          onAfterSendScroll={scrollToBottom}
          firstMessageSent={firstMessageSent}
        />
      </div>
    </div>
  );
};

export default ChatPage;
