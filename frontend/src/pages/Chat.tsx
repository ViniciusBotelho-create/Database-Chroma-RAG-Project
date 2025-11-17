// src/pages/Chat.tsx
import React, { useEffect, useRef, useState } from "react";
import ChatWindow from "../components/ChatWindow";
import PromptInput from "../components/PromptInput";
import "../styles/Chat.css";
import { Message, ImageMeta } from "../types/Chat";

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [firstMessageSent, setFirstMessageSent] = useState(false);
  const [mode, setMode] = useState<"rag" | "norag">("rag");
  const chatRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatRef.current) {
        chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
      }
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // -------------------- FUNÇÕES AUXILIARES --------------------

  const sanitizeUrl = (raw: string) => (raw ?? "").replace(/[)\]}.,]+$/g, "");
  const extractLinks = (text?: string): string[] => {
    if (!text) return [];
    const matches = String(text).match(/https?:\/\/[^\s)\]}<>"]+/g) || [];
    return matches.map(sanitizeUrl);
  };
  const isPdfUrl = (url: string) => /\.pdf(\?.*)?$/i.test(url);

  const normalizeImages = (imgs: any): ImageMeta[] => {
    if (!imgs) return [];
    if (Array.isArray(imgs)) {
      return imgs
        .map((it) => {
          if (!it) return null;
          if (typeof it === "string") {
            return { url: it } as ImageMeta;
          }
          return {
            id: String(it.id ?? it._id ?? "") || undefined,
            url: it.url ?? it.path ?? it.src ?? "",
            title: it.title ?? it.titles ?? undefined,
            text: it.text ?? it.texts ?? undefined,
            category: it.category ?? undefined,
            score: Number(it.score ?? it.distance ?? it.similarity ?? NaN) || undefined,
          } as ImageMeta;
        })
        .filter((i): i is ImageMeta => !!i && !!i.url);
    }
    if (typeof imgs === "string") {
      const urls = String(imgs).match(/https?:\/\/[^\s)\]}]+/g) || [];
      return urls.map((u) => ({ url: u }));
    }
    return [];
  };

  const normalizePdfs = (data: any): { url: string; title?: string }[] => {
    const candidates: string[] = [];

    if (Array.isArray(data.images)) {
      data.images.forEach((it: any) => {
        const u = typeof it === "string" ? it : it?.url;
        if (u && isPdfUrl(u)) candidates.push(sanitizeUrl(u));
      });
    }

    if (data.refs) {
      const refsText = Array.isArray(data.refs) ? data.refs.join(" ") : String(data.refs);
      extractLinks(refsText).forEach((u) => { if (isPdfUrl(u)) candidates.push(sanitizeUrl(u)); });
    }

    if (data.answer) {
      extractLinks(String(data.answer)).forEach((u) => { if (isPdfUrl(u)) candidates.push(sanitizeUrl(u)); });
    }

    const unique = Array.from(new Set(candidates));
    return unique.map((u) => ({
      url: u,
      title: decodeURIComponent((u.split("/").pop() || u).split("?")[0])
    }));
  };

  const removeUrlsFromText = (text: string, urls: string[]) => {
    if (!text) return text || "";
    let out = text;
    urls.forEach((u) => {
      if (!u) return;
      const escaped = u.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      out = out.replace(new RegExp(escaped, "g"), "");
    });
    return out.replace(/\n{3,}/g, "\n\n").trim();
  };

  // -------------------- ENVIO DE MENSAGEM --------------------

  const handleSend = async (text: string) => {
    if (!text || !text.trim()) return;
    if (!firstMessageSent) setFirstMessageSent(true);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: text,
      role: "user",
    };
    setMessages((prev) => [...prev, userMessage]);

    const endpoint = mode === "rag" ? "http://localhost:8000/ask" : "http://localhost:8000/llm";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: text }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const assistantMessages: Message[] = [];

      const imagesFromApi = normalizeImages(data.images);
      const pdfsFromApi = normalizePdfs(data);

      const cleanedAnswer = data.answer ? removeUrlsFromText(String(data.answer), pdfsFromApi.map(p => p.url)) : "";

      if (cleanedAnswer || data.answer) {
        assistantMessages.push({
          id: crypto.randomUUID(),
          content: cleanedAnswer || String(data.answer),
          role: "assistant",
          images: imagesFromApi.length ? imagesFromApi : undefined,
          pdfs: pdfsFromApi.length ? pdfsFromApi : undefined,
        });
      }

      if (!data.answer) {
        if (imagesFromApi.length && !assistantMessages.some(m => m.images)) {
          assistantMessages.push({
            id: crypto.randomUUID(),
            content: "🖼️ Imagens relacionadas:",
            role: "assistant",
            images: imagesFromApi,
          });
        }
        if (pdfsFromApi.length && !assistantMessages.some(m => m.pdfs)) {
          assistantMessages.push({
            id: crypto.randomUUID(),
            content: "📄 Documentos relacionados:",
            role: "assistant",
            pdfs: pdfsFromApi,
          });
        }
      }

      if (assistantMessages.length === 0) {
        assistantMessages.push({ id: crypto.randomUUID(), content: "O servidor retornou uma resposta vazia.", role: "assistant" });
      }

      setMessages((prev) => [...prev, ...assistantMessages]);
    } catch (err) {
      console.error("Erro ao se comunicar com o servidor:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          content: "Erro ao se comunicar com o servidor.",
          role: "assistant",
        },
      ]);
    }
  };

  // -------------------- RENDER --------------------

  return (
    <div className={`chat-page`}>
      <div className="chat-wrapper">
        <div className="chat-content">
          <div className="chat-header">
            <div className="mode-toggle">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={mode === "rag"}
                  onChange={() => setMode((m) => (m === "rag" ? "norag" : "rag"))}
                />
                <span className="slider" />
              </label>
              <span className="mode-label">
                {mode === "rag" ? "RAG ativado" : "LLM puro"}
              </span>
            </div>
          </div>

          {!firstMessageSent ? (
            <div className="chat-intro">
              <p className="chat-intro-text">
                Escreva sua primeira mensagem para começar
              </p>
              <PromptInput
                onSend={handleSend}
                onAfterSendScroll={scrollToBottom}
                firstMessageSent={false}
              />
            </div>
          ) : (
            <>
              <div className="chat-window" ref={chatRef}>
                <ChatWindow messages={messages} />
              </div>

              <div className="chat-footer">
                <PromptInput
                  onSend={handleSend}
                  onAfterSendScroll={scrollToBottom}
                  firstMessageSent={true}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
