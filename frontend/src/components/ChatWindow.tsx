// src/components/ChatWindow.tsx
import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import "../styles/ChatWindow.css";
import { Message } from "../types/Chat";

interface ChatWindowProps {
  messages: Message[];
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages }) => {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  return (
    <div className="messages-container" role="log" aria-live="polite">
      {messages.map((msg) => (
        // Passa o objeto msg inteiro para o MessageBubble
        <MessageBubble key={msg.id} message={msg} />
      ))}
      <div ref={endRef} />
    </div>
  );
};

export default ChatWindow;
