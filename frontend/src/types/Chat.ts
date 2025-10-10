// src/types/chat.ts
export interface ImageMeta {
  id?: string;
  url: string;
  title?: string;
  text?: string;
  category?: string;
  score?: number;
}

export interface PdfMeta {
  url: string;
  title?: string;
}

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  images?: ImageMeta[];
  pdfs?: PdfMeta[];
}
