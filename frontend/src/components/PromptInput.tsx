// src/components/PromptInput.tsx
import React, { useState } from "react";
import "../styles/PromptInput.css";

interface PromptInputProps {
  onSend: (text: string) => void;
  onAfterSendScroll: () => void;
  firstMessageSent: boolean;
}

const PromptInput: React.FC<PromptInputProps> = ({
  onSend,
  onAfterSendScroll,
  firstMessageSent,
}) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input);
      setInput("");
      onAfterSendScroll();
    }
  };

  return (
    <div className={`prompt-input ${firstMessageSent ? "bottom" : "center"}`}>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Digite sua pergunta..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit">Enviar</button>
      </form>
    </div>
  );
};

export default PromptInput;
