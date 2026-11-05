# Nova AI — React + OpenRouter

واجهة محادثة عربية أنيقة ومتجاوبة، مع بث الرد من OpenRouter تدريجياً (Streaming).

## المتطلبات
- Node.js 18 أو أحدث.
- مفتاح API من OpenRouter.

## التشغيل محلياً

1. فك ضغط مجلد المشروع وافتحه في VS Code.
2. افتح Terminal داخل مجلد `nova-chatbot`.
3. ثبّت الحزم:

   ```bash
   npm install
   ```

4. أنشئ ملفاً اسمه `.env` في جذر المشروع (بجانب `package.json`) واكتب داخله:

   ```env
   OPENROUTER_API_KEY=ضع_مفتاحك_هنا
   ```

   لا تضع المفتاح في ملفات React أو في متغير يبدأ بـ `VITE_`. ملف `.env` مستثنى من Git.

5. شغّل الواجهة:

   ```bash
   npm run dev
   ```

   **مهم:** استدعاء `/api/chat` يحتاج بيئة Vercel Functions. للتجربة المحلية استخدم Vercel CLI:

   ```bash
   npm install -g vercel
   vercel dev
   ```

   ثم افتح الرابط الذي يظهر في الطرفية (غالباً `http://localhost:3000`).

## رفع المشروع إلى GitHub

من داخل مجلد المشروع:

```bash
git init
git add .
git commit -m "Initial Nova AI chatbot"
git branch -M main
git remote add origin https://github.com/USERNAME/REPOSITORY.git
git push -u origin main
```

استبدل `USERNAME/REPOSITORY` برابط مستودعك الحقيقي.

## النشر على Vercel

1. افتح https://vercel.com وسجّل الدخول عبر GitHub.
2. اختر **Add New → Project** ثم مستودع المشروع.
3. اترك إعدادات Vite الافتراضية: Build Command `npm run build` و Output Directory `dist`.
4. من **Environment Variables** أضف:
   - Name: `OPENROUTER_API_KEY`
   - Value: مفتاح OpenRouter الخاص بك.
   - فعّل البيئات التي تريدها (Production و Preview و Development).
5. اضغط Deploy. إذا أضفت المفتاح بعد النشر، أعد Deploy كي يُقرأ المتغير الجديد.

## كيف يعمل البث؟
المتصفح يرسل المحادثة إلى `/api/chat`، وهي وظيفة خادمية تحفظ المفتاح وتستدعي OpenRouter مع `stream: true`. ثم تمرر أجزاء النص إلى الواجهة فور وصولها؛ لذلك لا ينتظر المستخدم اكتمال الإجابة.

## فحوصات سريعة
- تأكد أن `.env` لا يظهر ضمن الملفات المضافة إلى Git.
- جرّب سؤالاً قصيراً بعد تشغيل `vercel dev`.
- إذا ظهر خطأ 401، تحقق من المفتاح.
- إذا ظهر 429 أو لم يتوفر نموذج مجاني، جرّب لاحقاً؛ التوفر والحدود يحددهما OpenRouter ومزودو النماذج.
- لا ترفع ملف `.env` ولا تشارك المفتاح في الصور أو المستودع.

روابط مفيدة:
- https://openrouter.ai/keys
- https://openrouter.ai/docs/api-reference/streaming
- https://vercel.com/docs/functions
