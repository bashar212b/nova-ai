export const config = {
  runtime: "nodejs"
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "مفتاح OpenRouter غير مضبوط. أضف OPENROUTER_API_KEY في متغيرات البيئة."
    });
  }

  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "الرسائل المرسلة غير صالحة." });
  }

  try {
    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_URL || "https://vercel.com",
        "X-OpenRouter-Title": "Nova AI Chat"
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages,
        stream: true,
        temperature: 0.7
      })
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      let message = detail;
      try {
        const parsed = JSON.parse(detail);
        message = parsed?.error?.message || detail;
      } catch {}
      return res.status(upstream.status).json({
        error: `OpenRouter: ${message.slice(0, 500)}`
      });
    }

    if (!upstream.body) {
      return res.status(502).json({ error: "لم يصل تدفق من OpenRouter." });
    }

    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    const reader = upstream.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
      res.end();
    } catch (error) {
      res.end();
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    if (!res.headersSent) {
      return res.status(500).json({
        error: "تعذر الاتصال بخدمة الذكاء الاصطناعي. تحقق من الاتصال وحاول مجدداً."
      });
    }
    res.end();
  }
}
