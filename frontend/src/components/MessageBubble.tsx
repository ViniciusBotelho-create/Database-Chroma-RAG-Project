// src/components/MessageBubble.tsx
import React from "react";
import "../styles/MessageBubble.css";

interface MessageBubbleProps {
  message: string;
  role: "user" | "assistant";
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, role }) => {
  return (
    <div className={`message-bubble ${role}`}>
      <div className="bubble-content">{message}</div>
    </div>
  );
};

export default MessageBubble;
