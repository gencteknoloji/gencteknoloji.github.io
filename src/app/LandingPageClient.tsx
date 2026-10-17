"use client";

import { useEffect, useState, useRef } from "react";
import { 
  MessageCircle, 
  Send, 
  X, 
  Lock,
  Sparkles,
  PhoneCall,
  MapPin
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { GoogleReviewsSection } from "@/components/GoogleReviewsSection";
import { getSupabaseUrl } from "@/lib/supabase";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function LandingPageClient() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Merhaba! Ben Genç Teknoloji Turkcell Dijital Satış Noktası | DNS EXTRA Asistanıyım. Turkcell tarifeleri, paketleri, güncel cihaz kampanyaları ve mağazamızın teknik servis hizmetleri hakkında bilgi alabilirsiniz. Size nasıl yardımcı olabilirim?"
    }
  ]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chatLoading]);

  // AI Mesaj Gönderme
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    
    // Mesajı ekle
    const updatedMessages: ChatMessage[] = [...messages, { role: "user", content: userMessage }];
    setMessages(updatedMessages);
    setChatLoading(true);

    try {
      const supabaseUrl = getSupabaseUrl();
      if (!supabaseUrl) {
        throw new Error("Supabase yapılandırması eksik.");
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP Hata: ${response.status}`);
      }

      const resData = await response.json();
      
      // Çeşitli JSON formatlarını destekle
      let aiText = "";
      if (resData.result && resData.result.response) {
        aiText = resData.result.response;
      } else if (resData.response) {
        aiText = resData.response;
      } else if (resData.text) {
        aiText = resData.text;
      } else if (resData.choices && resData.choices[0] && resData.choices[0].message) {
        aiText = resData.choices[0].message.content;
      } else {
        aiText = "Anlaşılır bir yanıt alınamadı.";
      }

      setMessages([...updatedMessages, { role: "assistant", content: aiText }]);
    } catch (err) {
      console.error("AI Asistan hatası:", err);
      // Kullanıcıya hissettirmeden kibar bir fallback ver
      setMessages([
        ...updatedMessages,
        { 
          role: "assistant", 
          content: "Şu anda yapay zeka asistanımızda kısa süreli bir güncelleme çalışması yapılmaktadır. Merak ettiğiniz cihazlar, güncel Turkcell paketleri veya kampanyalarımız hakkında anında bilgi ve destek almak için aşağıdaki yeşil butona tıklayarak WhatsApp destek hattımıza doğrudan bağlanabilirsiniz." 
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --tc-blue: #004B93;       /* Turkcell Derin Mavi */
          --tc-blue-dark: #002D5E;  /* Koyu Lacivert */
          --tc-yellow: #FFD100;     /* Turkcell Sarı */
          --tc-cyan: #00A5DF;       /* Turkcell Açık Mavi */
          --bg-dark: #030712;       /* Premium Siyah */
          --surface-dark: #0b1120;  /* Kart Arka Planı */
          --border-color: rgba(0, 75, 147, 0.2);
          --border-glow: rgba(255, 209, 0, 0.15);
          --wa-green: #25D366;      /* WhatsApp Yeşili */
          --font: 'Outfit', sans-serif;
        }

        html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
        body {
          background: var(--bg-dark);
          color: #f3f4f6;
          font-family: var(--font);
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
          min-height: 100dvh;
          padding-left: env(safe-area-inset-left, 0px);
          padding-right: env(safe-area-inset-right, 0px);
        }

        /* Navigasyon Barı */
        .header-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding:
            calc(clamp(0.75rem, 2vw, 1rem) + env(safe-area-inset-top, 0px))
            max(clamp(1rem, 5vw, 4rem), env(safe-area-inset-right, 0px))
            clamp(0.75rem, 2vw, 1rem)
            max(clamp(1rem, 5vw, 4rem), env(safe-area-inset-left, 0px));
          min-height: calc(72px + env(safe-area-inset-top, 0px));
          background: rgba(3, 7, 18, 0.8);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          gap: 0.75rem;
        }
        .header-brand {
          display: flex; align-items: center; gap: 0.75rem;
          min-width: 0; flex: 1;
        }
        .header-logo-badge {
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          filter: drop-shadow(0 0 12px rgba(0, 165, 223, 0.35));
        }
        .header-title-box {
          display: flex; flex-direction: column;
        }
        .header-title {
          font-size: clamp(1.2rem, 2.5vw, 1.45rem); font-weight: 900; color: #fff; letter-spacing: -0.02em; line-height: 1.15;
        }
        .header-subtitle {
          font-size: 0.58rem; font-weight: 500; color: var(--tc-yellow); text-transform: uppercase; letter-spacing: 0.04em; line-height: 1.2; margin-top: 0.15rem;
        }

        .btn-landing {
          display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
          padding: 0.7rem 1.35rem; border-radius: 12px;
          font-size: 0.875rem; font-weight: 700; text-decoration: none;
          cursor: pointer; border: 1px solid transparent;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
        }
        .btn-landing-primary {
          background: linear-gradient(135deg, #1e3a8a 0%, #312e81 55%, #1e1b4b 100%);
          border-color: rgba(96, 165, 250, 0.4);
          color: #fff;
          box-shadow: 0 4px 16px rgba(30, 58, 138, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
        .btn-landing-primary:hover {
          border-color: rgba(147, 197, 253, 0.65);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(30, 58, 138, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.12);
        }
        .btn-landing-primary:active {
          transform: translateY(0);
          box-shadow: 0 3px 10px rgba(30, 58, 138, 0.45);
        }
        .btn-landing-secondary {
          background: rgba(255, 255, 255, 0.07);
          border-color: rgba(255, 255, 255, 0.18);
          color: #fff;
          box-shadow: 0 3px 12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }
        .btn-landing-secondary:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.28);
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
        }
        .btn-landing-secondary:active {
          transform: translateY(0);
        }

        /* Hero Bölümü */
        .landing-hero {
          position: relative;
          min-height: calc(85dvh - env(safe-area-inset-top, 0px));
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center;
          padding:
            calc(8rem + env(safe-area-inset-top, 0px))
            max(1rem, env(safe-area-inset-right, 0px))
            calc(4rem + env(safe-area-inset-bottom, 0px))
            max(1rem, env(safe-area-inset-left, 0px));
          overflow: hidden;
          background: radial-gradient(circle at top, rgba(0, 75, 147, 0.15) 0%, transparent 60%);
        }
        .hero-glow-blob {
          position: absolute; width: 40vw; height: 40vw;
          top: 15%; left: 30%; border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 165, 223, 0.08) 0%, transparent 70%);
          filter: blur(80px); pointer-events: none;
        }
        .hero-headline {
          font-size: clamp(2rem, 6vw, 4.2rem);
          font-weight: 900; line-height: 1.1; letter-spacing: -0.03em;
          max-width: 900px;
        }
        .hero-headline span.highlight-yellow {
          color: var(--tc-yellow);
          text-shadow: 0 0 30px rgba(255, 209, 0, 0.3);
        }
        .hero-headline span.highlight-cyan {
          color: var(--tc-cyan);
          text-shadow: 0 0 30px rgba(0, 165, 223, 0.3);
        }
        .hero-desc {
          margin-top: 1.5rem; max-width: 600px;
          font-size: clamp(0.95rem, 2vw, 1.15rem);
          color: #9ca3af; line-height: 1.6;
        }

        /* Hızlı Özellik Çipleri */
        .feature-chips {
          display: flex; justify-content: center; flex-wrap: wrap; gap: 0.75rem;
          margin-top: 2.5rem; max-width: 800px;
        }
        .feature-chip {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 0.5rem 1.1rem; border-radius: 99px;
          font-size: 0.8rem; font-weight: 600; color: #d1d5db;
          display: flex; align-items: center; gap: 0.5rem;
          transition: all 0.25s;
        }
        .feature-chip:hover {
          border-color: var(--tc-cyan);
          background: rgba(0, 165, 223, 0.05);
          transform: translateY(-2px);
        }
        .feature-chip-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--tc-yellow);
        }

        /* Floating WhatsApp Bubble */
        .floating-wa-bubble {
          position: fixed;
          bottom: calc(90px + env(safe-area-inset-bottom, 0px));
          right: max(24px, env(safe-area-inset-right, 0px));
          z-index: 200;
          display: flex; align-items: center; gap: 0.6rem;
          background: var(--wa-green); color: white;
          padding: 0.75rem 1.25rem; border-radius: 99px;
          box-shadow: 0 8px 30px rgba(37, 211, 102, 0.4);
          font-weight: 700; font-size: 0.85rem; text-decoration: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: pulse-green 2s infinite;
          min-height: 44px;
        }
        .floating-wa-bubble:hover {
          transform: scale(1.05) translateY(-3px);
          filter: brightness(1.1);
        }
        @keyframes pulse-green {
          0% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.6); }
          70% { box-shadow: 0 0 0 15px rgba(37, 211, 102, 0); }
          100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); }
        }

        /* Floating AI Assistant Trigger Bubble */
        .floating-ai-trigger {
          position: fixed;
          bottom: max(24px, env(safe-area-inset-bottom, 0px));
          right: max(24px, env(safe-area-inset-right, 0px));
          z-index: 200;
          width: 54px; height: 54px; border-radius: 50%;
          background: linear-gradient(135deg, var(--tc-blue) 0%, var(--tc-cyan) 100%);
          display: flex; align-items: center; justify-content: center;
          color: var(--tc-yellow); cursor: pointer;
          box-shadow: 0 8px 30px rgba(0, 75, 147, 0.4);
          border: 2px solid var(--tc-yellow);
          transition: all 0.3s;
        }
        .floating-ai-trigger:hover {
          transform: scale(1.1) rotate(5deg);
          box-shadow: 0 10px 35px rgba(0, 165, 223, 0.6);
        }

        /* Yapay Zeka Asistan Chat Kutusu */
        .ai-chat-window {
          position: fixed;
          bottom: calc(90px + env(safe-area-inset-bottom, 0px));
          right: max(24px, env(safe-area-inset-right, 0px));
          z-index: 300;
          width: min(360px, calc(100vw - 32px - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px)));
          height: min(500px, calc(100dvh - 120px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)));
          max-height: calc(100dvh - 120px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px));
          background: #090e1a; border: 1px solid var(--border-color);
          border-radius: 24px; overflow: hidden;
          display: flex; flex-direction: column;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.5);
          animation: slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .chat-header {
          background: linear-gradient(135deg, var(--tc-blue-dark) 0%, var(--tc-blue) 100%);
          padding: 1rem 1.25rem; display: flex; align-items: center; justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .chat-header-brand {
          display: flex; align-items: center; gap: 0.6rem;
        }
        .chat-header-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: var(--tc-yellow); display: flex; align-items: center;
          justify-content: center; font-size: 0.95rem; font-weight: 900; color: #000;
        }
        .chat-header-info {
          display: flex; flex-direction: column;
        }
        .chat-header-title { font-size: 0.85rem; font-weight: 700; color: #fff; }
        .chat-header-status { font-size: 0.62rem; color: var(--tc-cyan); font-weight: 500; display: flex; align-items: center; gap: 0.25rem; }
        .chat-header-status-dot { width: 5px; height: 5px; border-radius: 50%; background: #25D366; }
        .chat-close-btn {
          color: rgba(255, 255, 255, 0.6); cursor: pointer; border: none; background: transparent;
          padding: 0.25rem; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .chat-close-btn:hover { color: #fff; background: rgba(255, 255, 255, 0.1); }

        .chat-messages {
          flex: 1; overflow-y: auto; padding: 1.25rem;
          display: flex; flex-direction: column; gap: 1rem;
        }
        .chat-bubble {
          max-width: 85%; padding: 0.75rem 1rem; border-radius: 16px;
          font-size: 0.8rem; line-height: 1.5; font-family: sans-serif;
        }
        .chat-bubble.assistant {
          align-self: flex-start; background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05); color: #e5e7eb;
          border-top-left-radius: 4px;
        }
        .chat-bubble.user {
          align-self: flex-end; background: linear-gradient(135deg, var(--tc-blue) 0%, #003770 100%);
          color: #fff; border-top-right-radius: 4px;
        }
        .chat-loading-dots {
          display: flex; gap: 0.25rem; align-items: center; padding: 0.5rem 0.25rem;
        }
        .chat-loading-dot {
          width: 6px; height: 6px; border-radius: 50%; background: var(--tc-cyan);
          animation: bounce 1.4s infinite ease-in-out both;
        }
        .chat-loading-dot:nth-child(1) { animation-delay: -0.32s; }
        .chat-loading-dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }

        .chat-footer {
          padding: 0.75rem 1rem; border-top: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(0, 0, 0, 0.2);
        }
        .chat-input-form {
          display: flex; gap: 0.5rem;
        }
        .chat-input {
          flex: 1; background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px; color: #fff; padding: 0.55rem 0.85rem;
          outline: none; font-size: 0.8rem; transition: all 0.2s;
        }
        .chat-input:focus {
          border-color: var(--tc-cyan);
          box-shadow: 0 0 0 2px rgba(0, 165, 223, 0.15);
        }
        .chat-send-btn {
          background: var(--tc-yellow); color: #000; border: none;
          border-radius: 10px; width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.25s;
        }
        .chat-send-btn:hover {
          transform: translateY(-1px); filter: brightness(1.1);
        }

        /* Bilgi Bannerı */
        .contact-info-strip {
          background: linear-gradient(90deg, #09122c 0%, #001f44 100%);
          border-top: 1px solid var(--border-color);
          border-bottom: 1px solid var(--border-color);
          padding: 2.5rem clamp(1rem, 5vw, 4rem);
          margin-top: 3rem;
        }
        .info-strip-content {
          max-width: 720px; margin: 0 auto;
          display: flex; flex-direction: column; align-items: center; text-align: center;
        }
        .info-strip-title {
          font-size: 1.25rem; font-weight: 800; color: #fff;
          margin-bottom: 0.5rem; width: 100%;
        }
        .info-strip-desc {
          font-size: 0.8rem; color: #9ca3af; line-height: 1.6;
          margin-bottom: 1.5rem; max-width: 560px;
        }
        .info-strip-actions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.875rem;
          width: 100%; max-width: 480px;
        }
        .info-strip-actions .btn-landing {
          width: 100%; min-height: 46px;
        }

        /* Footer */
        .landing-footer {
          background: #02050c; border-top: 1px solid rgba(255, 255, 255, 0.03);
          padding: 1.5rem clamp(1rem, 5vw, 4rem);
          display: flex; items-center: true; justify-content: space-between;
          flex-wrap: wrap; gap: 1rem; font-size: 0.78rem; color: #6b7280;
        }
        .footer-brand-box { display: flex; flex-direction: column; align-items: flex-start; gap: 0.1rem; font-weight: 600; }
        .footer-brand-name { font-size: 0.85rem; font-weight: 800; color: #fff; line-height: 1.1; }
        .footer-brand-tagline { font-size: 0.72rem; font-weight: 500; color: var(--tc-yellow); line-height: 1.2; }
        .footer-brand-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--tc-yellow); }

        .star-rating { display: inline-flex; align-items: center; gap: 0.45rem; }
        .star-rating-row { display: inline-flex; align-items: center; gap: 0.12rem; }
        .star-rating-item { position: relative; display: inline-flex; line-height: 0; }
        .star-rating-empty { color: rgba(255, 255, 255, 0.15); }
        .star-rating-fill {
          position: absolute; inset: 0 auto 0 0; overflow: hidden;
        }
        .star-rating-full { color: var(--tc-yellow); fill: var(--tc-yellow); }
        .star-rating-value { font-size: 0.95rem; font-weight: 800; color: #fff; }

        .google-reviews-section {
          padding: 4rem clamp(1rem, 5vw, 4rem);
          background: radial-gradient(circle at top, rgba(0, 75, 147, 0.12) 0%, transparent 55%);
        }
        .google-reviews-inner {
          max-width: 1100px; margin: 0 auto;
        }
        .google-reviews-header { text-align: center; margin-bottom: 2rem; }
        .google-reviews-badge {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.35rem 0.85rem; border-radius: 99px;
          background: rgba(255, 209, 0, 0.08); border: 1px solid rgba(255, 209, 0, 0.25);
          color: var(--tc-yellow); font-size: 0.72rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.85rem;
        }
        .google-reviews-title {
          font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 900; color: #fff;
          letter-spacing: -0.02em;
        }
        .google-reviews-desc {
          margin-top: 0.6rem; color: #9ca3af; font-size: 0.88rem; line-height: 1.6;
          max-width: 560px; margin-left: auto; margin-right: auto;
        }
        .google-reviews-summary {
          display: flex; align-items: center; justify-content: space-between;
          gap: 1.5rem; flex-wrap: wrap;
          background: var(--surface-dark); border: 1px solid var(--border-color);
          border-radius: 20px; padding: 1.5rem 1.75rem; margin-bottom: 1.75rem;
        }
        .google-reviews-score {
          display: flex; flex-direction: column; align-items: flex-start; gap: 0.45rem;
        }
        .google-reviews-score-value {
          font-size: 2.5rem; font-weight: 900; color: var(--tc-yellow); line-height: 1;
        }
        .google-reviews-count { font-size: 0.78rem; color: #9ca3af; font-weight: 600; }
        .google-reviews-actions {
          display: flex; flex-wrap: wrap; gap: 0.75rem;
        }
        .google-reviews-btn { min-height: 44px; }
        .google-reviews-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 1rem; margin-bottom: 1.75rem;
        }
        .google-review-card {
          background: var(--surface-dark); border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 18px; padding: 1.25rem;
          transition: border-color 0.25s, transform 0.25s;
        }
        .google-review-card:hover {
          border-color: rgba(0, 165, 223, 0.35);
          transform: translateY(-2px);
        }
        .google-review-card-top {
          display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.85rem;
        }
        .google-review-avatar {
          width: 40px; height: 40px; border-radius: 50%;
          background: linear-gradient(135deg, var(--tc-blue) 0%, var(--tc-cyan) 100%);
          color: var(--tc-yellow); font-weight: 900; font-size: 0.95rem;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(255, 209, 0, 0.35); flex-shrink: 0;
        }
        .google-review-author {
          font-size: 0.88rem; font-weight: 700; color: #fff; line-height: 1.2;
        }
        .google-review-meta {
          display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem;
        }
        .google-review-time { font-size: 0.68rem; color: #6b7280; }
        .google-review-text {
          font-size: 0.82rem; color: #d1d5db; line-height: 1.55;
        }
        .google-reviews-map-wrap {
          position: relative; border-radius: 20px; overflow: hidden;
          border: 1px solid var(--border-color); background: #000;
        }
        .google-reviews-map {
          width: 100%; height: 280px; border: 0; display: block;
        }
        .google-reviews-map-link {
          position: absolute; right: 1rem; bottom: 1rem;
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.55rem 0.9rem; border-radius: 10px;
          background: rgba(3, 7, 18, 0.88); border: 1px solid rgba(255, 255, 255, 0.12);
          color: #fff; font-size: 0.75rem; font-weight: 700; text-decoration: none;
          backdrop-filter: blur(8px);
        }
        .google-reviews-map-link:hover {
          border-color: var(--tc-cyan); color: var(--tc-cyan);
        }

        @media (max-width: 640px) {
          .landing-footer { flex-direction: column; text-align: center; align-items: center; padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px)); }
          .footer-brand-box { align-items: center; }
          .header-nav {
            align-items: flex-start;
            flex-wrap: wrap;
          }
          .header-title { font-size: 1rem; }
          .header-subtitle { font-size: 0.52rem; line-height: 1.15; }
          .btn-landing { min-height: 44px; padding: 0.65rem 1rem; font-size: 0.8rem; }
          .landing-hero {
            min-height: auto;
            padding-top: calc(7rem + env(safe-area-inset-top, 0px));
            padding-bottom: calc(2.5rem + env(safe-area-inset-bottom, 0px));
          }
          .hero-headline { font-size: clamp(1.65rem, 8vw, 2.25rem); }
          .feature-chips { gap: 0.5rem; }
          .feature-chip { font-size: 0.72rem; padding: 0.45rem 0.85rem; }
          .ai-chat-window {
            left: max(16px, env(safe-area-inset-left, 0px));
            right: max(16px, env(safe-area-inset-right, 0px));
            width: auto;
          }
          .contact-info-strip { padding-left: max(1rem, env(safe-area-inset-left, 0px)); padding-right: max(1rem, env(safe-area-inset-right, 0px)); }
          .info-strip-actions { grid-template-columns: 1fr; max-width: 280px; }
          .google-reviews-summary { flex-direction: column; align-items: stretch; }
          .google-reviews-actions { flex-direction: column; }
          .google-reviews-actions .btn-landing { width: 100%; }
          .google-reviews-grid { grid-template-columns: 1fr; }
          .google-reviews-section { padding-left: max(1rem, env(safe-area-inset-left, 0px)); padding-right: max(1rem, env(safe-area-inset-right, 0px)); }
        }
      `}</style>

      {/* HEADER NAV */}
      <nav className="header-nav">
        <div className="header-brand">
          <div className="header-logo-badge">
            <BrandLogo size={42} />
          </div>
          <div className="header-title-box">
            <span className="header-title">Genç Teknoloji</span>
            <span className="header-subtitle">Turkcell Dijital Satış Noktası | DNS EXTRA</span>
          </div>
        </div>
        <div>
          <a
            href="/dashboard/"
            className="btn-landing btn-landing-primary"
          >
            <Lock size={14} className="text-yellow-400" />
            <span>Dashboard Girişi</span>
          </a>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="landing-hero">
        <div className="hero-glow-blob" />
        <h1 className="hero-headline">
          Cihaz, Tarife ve Teknik Servis<br />
          <span className="highlight-yellow">Genç Teknoloji</span> <span className="highlight-cyan">DNS EXTRA</span>'da
        </h1>
        <p className="hero-desc">
          Güncel kampanyalar ve orijinal cihazlar için WhatsApp veya AI asistanımızla hemen ulaşın.
        </p>

        <div className="feature-chips">
          {[
            "Turkcell Cihaz Kampanyaları",
            "Orijinal Aksesuarlar",
            "Hızlı WhatsApp Sipariş Hattı",
            "Güvenilir Teknik Servis Hizmeti",
            "Yapay Zeka Destekli Asistan"
          ].map(chip => (
            <div key={chip} className="feature-chip">
              <span className="feature-chip-dot" />
              {chip}
            </div>
          ))}
        </div>
      </header>

      {/* FLOATING WHATSAPP SUPPORT BUBBLE */}
      <a 
        href="https://wa.me/903323501166?text=Merhaba%2C%20Gen%C3%A7%20Teknoloji%20Turkcell%20Dijital%20Sat%C4%B1%C5%9F%20Noktas%C4%B1%20EXTRA%20%C3%BCzerinden%20do%C4%9Frudan%20destek%20almak%20istiyorum."
        target="_blank" 
        rel="noopener noreferrer" 
        className="floating-wa-bubble"
        title="WhatsApp Destek Hattı"
      >
        <MessageCircle size={20} />
        <span>Destek Merkezi</span>
      </a>

      {/* FLOATING AI ASSISTANT TRIGGER */}
      <button 
        onClick={() => setChatOpen(!chatOpen)}
        className="floating-ai-trigger"
        title="Yapay Zeka Destek Asistanı"
      >
        {chatOpen ? <X size={22} /> : <Sparkles size={22} />}
      </button>

      {/* AI ASSISTANT CHAT WINDOW */}
      {chatOpen && (
        <div className="ai-chat-window">
          <div className="chat-header">
            <div className="chat-header-brand">
              <div className="chat-header-avatar">AI</div>
              <div className="chat-header-info">
                <span className="chat-header-title">GNC Yapay Zeka</span>
                <span className="chat-header-status">
                  <span className="chat-header-status-dot" />
                  Çevrimiçi Danışman
                </span>
              </div>
            </div>
            <button className="chat-close-btn" onClick={() => setChatOpen(false)}>
              <X size={16} />
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((m, idx) => (
              <div key={idx} className={`chat-bubble ${m.role}`}>
                {m.content}
              </div>
            ))}
            {chatLoading && (
              <div className="chat-bubble assistant">
                <div className="chat-loading-dots">
                  <span className="chat-loading-dot" />
                  <span className="chat-loading-dot" />
                  <span className="chat-loading-dot" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-footer">
            <form onSubmit={handleSendChat} className="chat-input-form">
              <input 
                type="text" 
                placeholder="Mesajınızı yazın..." 
                className="chat-input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={chatLoading}
              />
              <button type="submit" className="chat-send-btn" disabled={chatLoading}>
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      <GoogleReviewsSection />

      {/* CONTACT INFO STRIP */}
      <div className="contact-info-strip">
        <div className="info-strip-content">
          <h4 className="info-strip-title">Mağazamıza Ulaşın</h4>
          <p className="info-strip-desc">
            Kampanya, hat açılışı ve cihaz işlemleriniz için telefon, WhatsApp veya AI asistanımızdan ulaşın.
          </p>
          <div className="info-strip-actions">
            <a 
              href="tel:03323501166" 
              className="btn-landing btn-landing-secondary"
            >
              <PhoneCall size={15} className="text-yellow-400" />
              <span>0332 350 11 66</span>
            </a>
            <a 
              href="https://share.google/XqHWx9kGLpyc0qyWS" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-landing btn-landing-primary"
            >
              <MapPin size={15} className="text-yellow-400" />
              <span>Google İşletme</span>
            </a>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-brand-box">
          <span className="footer-brand-name">Genç Teknoloji</span>
          <span className="footer-brand-tagline">Turkcell Dijital Satış Noktası | DNS EXTRA</span>
        </div>
        <div>
          © {new Date().getFullYear()} Genç Teknoloji — Turkcell Dijital Satış Noktası | DNS EXTRA. Tüm hakları saklıdır.
        </div>
      </footer>
    </>
  );
}
