# 🚀 ai.iportal.uz (`iportal-ai`) — Ko'p Provayderli & Taqsimlangan Bepul AI Gateway

> **0$ Budjet (100% Bepul)** bilan dunyoning eng kuchli AI modellarini (Llama 3.3 70B, Gemini 2.0 Flash, DeepSeek R1 70B, Qwen 2.5 Coder) yagona `iportal-ai` modeli sifatida birlashtiruvchi, taqsimlangan bepul hostinglar tarmog'i (Cloudflare Workers, Deno Deploy, Vercel Edge, Netlify) asosida ishlovchi aqlli AI platformasi.

---

## ✨ Asosiy Xususiyatlar

- 🧠 **Yagona `iportal-ai` Smart Routeri:** Foydalanuvchi bitta model bilan muloqot qiladi, orqa fonda tizim eng tez va sifatli bepul provayderni (Groq, Gemini, SambaNova, Cerebras, OpenRouter, Mistral) avtomatik tanlaydi.
- 🌐 **Distributed Multi-IP Mesh (Zero IP Block):** Bepul AI provayderlar bitta IP dan ko'p so'rov tushganda bloklamasligi uchun so'rovlar Cloudflare Workers, Deno Deploy, Vercel Edge kabi turli bepul serverlar orqali taqsimlanadi.
- 🔄 **Intellektual 429 Failover & Circuit Breaker:** Agar bironta kalit yoki provayder Rate Limit (429) yoki xatolik bersa, 50ms ichida foydalanuvchiga sezdirmasdan zaxira kalit yoki boshqa provayderga o'tadi.
- 🔑 **API Kalitlar Boshqaruvi (`ip-live-...`):** Istalgan uchinchi tomon dasturlari, Telegram botlar, Python/Node.js scriptlari yoki Cursor/VS Code uchun cheksiz OpenAI-mos API kalitlarini yaratish va boshqarish.
- 💬 **Zamonaviy Web Chat UI:** ChatGPT / Claude darajasidagi toza interfeys, streaming javoblar, Markdown, sintaksis highlight, LaTeX formulalar (KaTeX), kod nusxalash va fikr yuritish jarayoni (Reasoning foldout).
- 📊 **Jonli Hosting & AI Klaster Monitoringi:** Qaysi hosting nodelar qanday tezlikda (ping ms) ishlayotgani va faol AI kalitlar holatini real vaqtda kuzatish va sinash.

---

## 🛠 O'rnatish va Ishga Tushirish

### 1. Repozitoriyani klonlash va paketlarni o'rnatish:
```bash
git clone https://github.com/your-repo/ai-iportal-uz.git
cd ai-iportal-uz
npm install
```

### 2. Muhit o'zgaruvchilarini sozlash:
`.env.example` faylidan `.env.local` nusxa oling va bepul kalitlaringizni kiriting:
```bash
cp .env.example .env.local
```

### 3. Dasturni ishga tushirish:
```bash
npm run dev
```
Brauzerda `http://localhost:3000` manzilini oching.

---

## 📡 OpenAI-Mos API Orqali Foydalanish

Siz `https://ai.iportal.uz/v1/chat/completions` manziliga xuddi OpenAI ga murojaat qilgandek ulanishingiz mumkin:

### Python misoli:
```python
from openai import OpenAI

client = OpenAI(
    base_url="https://ai.iportal.uz/v1",
    api_key="ip-live-sizning-kalitingiz"
)

response = client.chat.completions.create(
    model="iportal-ai", # yoki iportal-ai-fast, iportal-ai-reasoning, iportal-ai-coder
    messages=[{"role": "user", "content": "Salom, menga yordam bera olasizmi?"}]
)

print(response.choices[0].message.content)
```

### cURL misoli:
```bash
curl https://ai.iportal.uz/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ip-live-sizning-kalitingiz" \
  -d '{
    "model": "iportal-ai",
    "messages": [{"role": "user", "content": "Salom!"}],
    "stream": true
  }'
```

---

## 📚 Bepul Kalitlar va Hostinglar Qo'llanmalari:
- [Bepul AI Kalitlarni Olish Qo'llanmasi (Groq, Gemini, SambaNova...)](docs/FREE_API_KEYS_GUIDE.md)
- [Bepul Hosting Worker Proxylarni O'rnatish Qo'llanmasi (Cloudflare, Deno...)](docs/FREE_HOSTING_DEPLOY_GUIDE.md)
- [ai.iportal.uz Domenini Bepul Ulash](docs/DOMAIN_SETUP_GUIDE.md)

---

## 📄 Litsenziya
MIT License. 100% Ochiq manbali va Bepul.
