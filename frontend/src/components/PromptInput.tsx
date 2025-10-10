// src/components/PromptInput.tsx
import React, { useRef, useState } from "react";
import { FiPaperclip, FiSend } from "react-icons/fi";
import "../styles/PromptInput.css";

interface PromptInputProps {
  onSend: (text: string) => void;
  onAfterSendScroll?: () => void;
  firstMessageSent?: boolean;
}

const PromptInput: React.FC<PromptInputProps> = ({
  onSend,
  onAfterSendScroll,
  firstMessageSent = false,
}) => {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput("");
    setFocused(false);
    if (onAfterSendScroll) onAfterSendScroll();
  };

  const handleFileClick = () => {
    fileRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const names = Array.from(files).map((f) => f.name).join(", ");
    // Anexa apenas os nomes ao input para o usuário revisar e enviar
    setInput((prev) => (prev ? prev + " " : "") + `[anexo: ${names}]`);
    // foca no input para mostrar o ícone de enviar
    setTimeout(() => inputRef.current?.focus(), 50);
    // limpa o value do input type=file
    e.currentTarget.value = "";
  };

  const showSend = focused || input.trim().length > 0;

  return (
    <div className={`prompt-input ${firstMessageSent ? "bottom" : "center"}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder={firstMessageSent ? "Digite sua pergunta..." : "Escreva sua primeira mensagem..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label="Prompt"
        />

        {/* input file oculto */}
        <input
          ref={fileRef}
          type="file"
          style={{ display: "none" }}
          onChange={handleFileChange}
          multiple
        />

        {/* Botão de anexo (visível quando não há foco e input vazio) */}
        <button
          type="button"
          className={`icon-btn attach ${!showSend ? "visible" : "hidden"}`}
          onClick={handleFileClick}
          title="Anexar arquivo"
        >
          <FiPaperclip size={18} />
        </button>

        {/* Botão de envio (visível durante foco ou se houver texto) */}
        <button
          type="submit"
          className={`icon-btn send ${showSend ? "visible" : "hidden"}`}
          title="Enviar mensagem"
        >
          <FiSend size={18} />
        </button>
      </form>
    </div>
  );
};

export default PromptInput;
