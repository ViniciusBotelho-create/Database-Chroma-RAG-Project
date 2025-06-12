// src/components/MessageBubble.tsx
import React from "react";
import "../styles/MessageBubble.css";

interface MessageBubbleProps {
  message: string;
  role: "user" | "assistant";
}

const formatMessage = (message: string): string => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const lines = message.split('\n');

  const linkCounts: Record<string, number> = {};
  const usedLinks = new Set<string>();
  const imageLines: string[] = [];
  const otherLines: string[] = [];

  const allLinks = message.match(urlRegex) || [];
  allLinks.forEach((url) => {
    linkCounts[url] = (linkCounts[url] || 0) + 1;
  });

  lines.forEach((line) => {
    const urlMatch = line.match(urlRegex);

    if (urlMatch) {
      const url = urlMatch[0];
      const isImage = /\.(jpeg|jpg|gif|png|webp)$/i.test(url) || url.includes(".blob.");

      if (isImage) {
        imageLines.push(`<img src="${url}" alt="imagem" style="max-width: 100%; margin-top: 10px;" />`);
      } else {
        if (!usedLinks.has(url)) {
          usedLinks.add(url);
          const count = linkCounts[url];
          const countLabel = count > 1 ? ` (x${count})` : "";
          otherLines.push(
            line.replace(url, `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>${countLabel}`)
          );
        }
        // Ignora linha duplicada
      }
    } else if (
      !line.startsWith("Contexto retirado do documento:") &&
      !line.startsWith("Link para o documento:")
    ) {
      otherLines.push(line);
    }
  });

  // Inserir "Imagens relacionadas:" sem pular linhas extras
  if (imageLines.length > 0) {
    if (otherLines.length > 0 && !otherLines[otherLines.length - 1].endsWith("<br>")) {
      otherLines.push("<br>");
    }
    otherLines.push(`<strong>Imagens relacionadas:</strong>`);
    otherLines.push(...imageLines);
  }

  return otherLines.join("<br>");
};




const MessageBubble: React.FC<MessageBubbleProps> = ({ message, role }) => {
  return (
    <div className={`message-bubble ${role}`}>
      <div
        className="bubble-content"
        dangerouslySetInnerHTML={{ __html: formatMessage(message) }}
      />

    </div>
  );
};

export default MessageBubble;
