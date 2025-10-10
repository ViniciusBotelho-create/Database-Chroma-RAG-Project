// src/components/MessageBubble.tsx
import React, { useState, useEffect, useCallback } from "react";
import "../styles/MessageBubble.css";
import { Message, ImageMeta } from "../types/Chat";

interface Props {
  message: Message;
}

const sanitizeUrl = (rawUrl: string) => (rawUrl ?? "").replace(/[)]}.,]+$/, "");

const formatMessageHtml = (message: string): string => {
  const urlRegex = /(https?:\/\/[^\s)\]}<>"]+)/g;
  return (message || "")
    .replace(urlRegex, (match) => {
      const clean = sanitizeUrl(match);
      return `<a href="${clean}" target="_blank" rel="noopener noreferrer">${clean}</a>`;
    })
    .replace(/\n/g, "<br>");
};

const MessageBubble: React.FC<Props> = ({ message }) => {
  const structuredImages: ImageMeta[] = message.images ?? [];
  const pdfs = (message as any).pdfs ?? []; // PdfMeta[]

  // Fallback: try extracting inline image URLs from content (if no structured images)
  const inlineImageUrls = (message.content || "").match(/https?:\/\/[^\s)\]}<>"]+/g)?.map(sanitizeUrl) || [];
  const inlineImageFiltered = inlineImageUrls.filter(u => /\.(jpe?g|png|gif|webp|svg|bmp)(\?.*)?$/i.test(u));

  // Lightbox minimal state (optional enhancement if you want later)
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = useCallback((i: number) => {
    setLightboxIndex(i);
    setLightboxOpen(true);
    document.body.style.overflow = "hidden";
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    document.body.style.overflow = "";
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") setLightboxIndex(i => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setLightboxIndex(i => i + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, closeLightbox]);

  return (
    <div className={`message-bubble ${message.role}`}>
      <div className="bubble-content" dangerouslySetInnerHTML={{ __html: formatMessageHtml(message.content) }} />

      {/* --- BOX de IMAGENS: aparência similar ao PDF box (não colapsável) --- */}
      {(structuredImages.length > 0 || inlineImageFiltered.length > 0) && (
        <div className="images-box">
          <div className="images-header">🖼️ Imagens relacionadas</div>

          <div className="images-grid">
            {/* Prefer structured images (sem legendas) */}
            {structuredImages.length > 0
              ? structuredImages.map((img, idx) => {
                  const src = sanitizeUrl(img.url);
                  return (
                    <button key={img.id ?? src} className="img-thumb" onClick={() => openLightbox(idx)} aria-label="abrir imagem">
                      <img src={src} alt={`imagem-${idx + 1}`} loading="lazy" onError={(e)=>{ (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    </button>
                  );
                })
              : inlineImageFiltered.map((u, i) => (
                  <a key={u + i} href={u} target="_blank" rel="noreferrer" className="img-thumb">
                    <img src={u} alt={`imagem-${i}`} loading="lazy" onError={(e)=>{ (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  </a>
                ))
            }
          </div>
        </div>
      )}

      {/* --- BOX de PDFs (ACORDEÃO) --- */}
      {Array.isArray(pdfs) && pdfs.length > 0 && (
        <details className="pdf-box">
          <summary className="pdf-summary">📄 Ver documentos e referências ({pdfs.length})</summary>

          <div className="pdf-list">
            {pdfs.map((p: any) => {
              const url = sanitizeUrl(p.url);
              const filename = p.title ?? decodeURIComponent((url.split("/").pop()||url).split("?")[0]);
              return (
                <div className="pdf-row" key={url}>
                  <a className="pdf-link" href={url} target="_blank" rel="noreferrer">{filename}</a>
                  <div className="pdf-actions">
                    <a className="btn small" href={url} target="_blank" rel="noreferrer">Abrir</a>
                    <a className="btn small outline" href={url} download target="_blank" rel="noreferrer">Baixar</a>
                  </div>
                </div>
              );
            })}
          </div>
        </details>
      )}

      {/* Lightbox overlay (simples) */}
      {lightboxOpen && (
        <div className="lightbox" onClick={closeLightbox}>
          <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={closeLightbox}>✕</button>
            <img src={sanitizeUrl(structuredImages[lightboxIndex]?.url ?? inlineImageFiltered[lightboxIndex])} alt="" />
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
