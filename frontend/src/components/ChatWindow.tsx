import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import "../styles/ChatWindow.css";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
}

interface ChatWindowProps {
  messages: Message[];
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages }) => {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-window">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg.content} role={msg.role} />
      ))}
      <div ref={endRef} />
    </div>
  );
};

export default ChatWindow;
