import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUp, Sparkles, Plus, MessageSquare, PanelRightClose,
  PanelRightOpen, Copy, Check, Bot, UserRound, Zap, ShieldCheck,
  Github, Menu, X, RotateCcw
} from "lucide-react";
import "./style.css";
import videoSource from './assets/robot.mp4';

const starterPrompts = [
  { icon: "✦", title: "اكتب لي فكرة إبداعية", text: "اقترح علي فكرة إبداعية ومميزة لمشروع جديد." },
  { icon: "⌘", title: "ساعدني في البرمجة", text: "اشرح لي مفهوم React بطريقة عملية وبسيطة." },
  { icon: "↗", title: "خطط لي يومي", text: "ساعدني في تنظيم يوم منتج ومتوازن." }
];

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(null);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  function newChat() {
    abortRef.current?.abort();
    setMessages([]);
    setInput("");
    setError("");
    setLoading(false);
    setSidebarOpen(false);
  }

  async function sendMessage(value = input) {
    const content = value.trim();
    if (!content || loading) return;

    setError("");
    setInput("");
    const nextMessages = [...messages, { role: "user", content }];
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "أنت مساعد ذكي ودود. أجب باللغة التي يستخدمها المستخدم، ونظّم الإجابة بوضوح." },
            ...nextMessages.map(({ role, content: text }) => ({ role, content: text }))
          ]
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        let message = "حدث خطأ أثناء الاتصال.";
        try {
          const data = await response.json();
          message = data.error || message;
        } catch {}
        throw new Error(message);
      }
      if (!response.body) throw new Error("المتصفح لا يدعم استقبال الرد المتدفق.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line || line.startsWith(":") || !line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (payload === "[DONE]") continue;

          try {
            const data = JSON.parse(payload);
            if (data.error) throw new Error(data.error.message || "حدث خطأ أثناء توليد الرد.");
            const chunk = data.choices?.[0]?.delta?.content;
            if (typeof chunk === "string" && chunk) {
              fullText += chunk;
              setMessages(current => {
                const updated = [...current];
                updated[updated.length - 1] = { role: "assistant", content: fullText };
                return updated;
              });
            }
          } catch (parseError) {
            if (parseError instanceof SyntaxError) continue;
            throw parseError;
          }
        }
      }

      if (!fullText) {
        setMessages(current => {
          const updated = [...current];
          updated[updated.length - 1] = {
            role: "assistant",
            content: "لم يصل نص في الرد. جرّب إرسال رسالتك مرة أخرى."
          };
          return updated;
        });
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message || "حدث خطأ غير متوقع.");
        setMessages(current => current.filter((item, index) =>
          !(index === current.length - 1 && item.role === "assistant" && !item.content)
        ));
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function copyText(text, index) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(index);
      setTimeout(() => setCopied(null), 1600);
    }).catch(() => setError("تعذر النسخ من المتصفح."));
  }

  function onKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Sparkles size={19} /></div>
          <span>nova<span className="brand-dot">.</span></span>
          <button className="icon-button mobile-close" onClick={() => setSidebarOpen(false)} aria-label="إغلاق القائمة"><X size={19} /></button>
        </div>

        <button className="new-chat" onClick={newChat}>
          <Plus size={18} /> محادثة جديدة
          <span className="shortcut">⌘ K</span>
        </button>

        <div className="side-label">مساحة العمل</div>
        <button className="nav-item active"><MessageSquare size={17} /> المحادثة الحالية</button>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon"><Zap size={17} /></div>
            <div>
              <strong>مدعوم بالذكاء الاصطناعي</strong>
              <p>إجابات ذكية، لحظياً.</p>
            </div>
          </div>
          <div className="profile">
            <div className="avatar-user">B</div>
            <div className="profile-copy"><strong>مستخدم Nova</strong><span>مساحة شخصية</span></div>
            <span className="online-dot" />
          </div>
        </div>
      </aside>

      {sidebarOpen && <button className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="إغلاق القائمة" />}

      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="فتح القائمة"><Menu size={20} /></button>
            <div className="model-indicator"><span className="status-dot" /> <span>Nova Assistant</span><span className="model-tag">FREE</span></div>
          </div>
          <div className="topbar-actions">
            <span className="secure-label"><ShieldCheck size={15} /> اتصال آمن</span>
            <button className="icon-button desktop-new" onClick={newChat} title="محادثة جديدة"><Plus size={19} /></button>
          </div>
        </header>

        <section className={`conversation ${messages.length ? "has-messages" : "welcome-mode"}`}>
          {messages.length === 0 ? (
            <div className="welcome">
              <div className="welcome-orb"><div className="orb-core"><Sparkles size={30} /></div><span className="orb-ring ring-a" /><span className="orb-ring ring-b" /></div>
              <div className="eyebrow"><span /> مساحة أفكارك تبدأ من هنا</div>
              <video className="video" autoPlay muted loop playsInline>
                <source src={videoSource} type="video/mp4" />
              </video>
              <h1>مرحباً، كيف يمكنني<br /><span>مساعدتك اليوم؟</span></h1>
              <p className="welcome-subtitle">اسأل، استكشف، ابتكر. أنا هنا لأحوّل أفكارك إلى خطوات واضحة.</p>
              <div className="suggestions">
                {starterPrompts.map((prompt, index) => (
                  <button className="suggestion-card" key={prompt.title} onClick={() => sendMessage(prompt.text)} style={{ animationDelay: `${index * 100}ms` }}>
                    <span className="suggestion-icon">{prompt.icon}</span>
                    <span><strong>{prompt.title}</strong><small>{prompt.text}</small></span>
                    <ArrowUp className="suggestion-arrow" size={16} />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="messages-list">
              {messages.map((message, index) => (
                <article className={`message-row ${message.role}`} key={index}>
                  <div className={`message-avatar ${message.role}`}>
                    {message.role === "assistant" ? <Sparkles size={17} /> : <UserRound size={17} />}
                  </div>
                  <div className="message-content">
                    <div className="message-name">{message.role === "assistant" ? "Nova" : "أنت"}</div>
                    <div className="message-bubble">
                      {message.content ? <div className="message-text">{message.content}</div> :
                        <div className="typing-indicator"><i /><i /><i /><span>يفكر الآن</span></div>}
                      {message.role === "assistant" && message.content && (
                        <button className="copy-button" onClick={() => copyText(message.content, index)}>
                          {copied === index ? <Check size={14} /> : <Copy size={14} />}
                          {copied === index ? "تم النسخ" : "نسخ"}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </section>

        <footer className="composer-area">
          {error && <div className="error-message"><span>{error}</span><button onClick={() => setError("")}>إغلاق</button></div>}
          <div className="composer">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={event => setInput(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="اكتب رسالتك هنا..."
              rows={1}
              disabled={loading}
              aria-label="اكتب رسالتك"
            />
            <div className="composer-tools">
              <span className="input-hint">Enter للإرسال · Shift + Enter لسطر جديد</span>
              <button className={`send-button ${input.trim() ? "ready" : ""}`} onClick={() => sendMessage()} disabled={!input.trim() || loading} aria-label="إرسال">
                {loading ? <span className="send-spinner" /> : <ArrowUp size={19} />}
              </button>
            </div>
          </div>
          <div className="disclaimer">قد يخطئ الذكاء الاصطناعي أحياناً. تحقق من المعلومات المهمة.</div>
        </footer>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
