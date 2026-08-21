# Bepul AI API Kalitlarini Olish Qo'llanmasi (0$ Budjet)

Ushbu qo'llanma orqali siz **1 tiyin ham sarflamasdan** eng kuchli zamonaviy AI modellari uchun o'nlab bepul API kalitlarni olishingiz mumkin.

---

## 1. Groq Cloud (Llama 3.3 70B & Gemma 2 — 300+ tok/s)
- **Sayt:** [https://console.groq.com](https://console.groq.com)
- **Bosqichlar:**
  1. Google yoki GitHub orqali ro'yxatdan o'ting.
  2. Chap menyudan **API Keys** bo'limiga o'ting.
  3. **Create API Key** tugmasini bosing va kalitni nusxalang (`gsk_...`).
  4. Istasangiz 2-3 ta turli Google akkaunt ochib, bir nechta kalit olishingiz mumkin.

## 2. Google AI Studio (Gemini 2.0 Flash — 1M Kontekst)
- **Sayt:** [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- **Bosqichlar:**
  1. Google akkauntingiz bilan kiring.
  2. **Get API Key** &gt; **Create API Key** tugmasini bosing.
  3. Berilgan kalitni (`AIzaSy...`) nusxalang.
  4. Bepul limit: Kuniga 1500 ta so'rov, daqiqasiga 15 ta so'rov.

## 3. SambaNova Cloud (DeepSeek R1 70B & Qwen 2.5 Coder)
- **Sayt:** [https://cloud.sambanova.ai](https://cloud.sambanova.ai)
- **Bosqichlar:**
  1. Ro'yxatdan o'ting.
  2. **APIs** &gt; **Create API Key** bo'limiga kiring.
  3. Kalitni nusxalang.
  4. DeepSeek R1 70B modeli juda chuqur mantiqiy xulosalar chiqarish uchun eng yaxshisi.

## 4. Cerebras Inference (Llama 3.1 8B/70B — 1000+ tok/s)
- **Sayt:** [https://cloud.cerebras.ai](https://cloud.cerebras.ai)
- **Bosqichlar:**
  1. Saytda bepul hisob oching.
  2. **API Keys** bo'limidan kalit oling (`csk_...`).
  3. Dunyodagi eng tezkor AI chipi — bir zumda javob beradi.

## 5. OpenRouter (Barcha Bepul Modellar Klasteri)
- **Sayt:** [https://openrouter.ai](https://openrouter.ai)
- **Bosqichlar:**
  1. Google yoki GitHub bilan kiring.
  2. **Keys** bo'limiga o'tib, **Create Key** bosing.
  3. Kredit to'ldirish shart emas — `:free` yorlig'iga ega barcha modellar tekin ishlaydi.

## 6. Mistral AI Console
- **Sayt:** [https://console.mistral.ai](https://console.mistral.ai)
- **Bosqichlar:**
  1. Ro'yxatdan o'ting.
  2. **API Keys** bo'limidan bepul "Experiment" kalitini oling.

---

## Kalitlarni Loyihaga Kiritish:
Olingan barcha kalitlarni:
1. `.env` fayliga vergul bilan ajratib yozing:
   ```env
   GROQ_API_KEYS=gsk_key1,gsk_key2,gsk_key3
   GEMINI_API_KEYS=AIzaKey1,AIzaKey2
   ```
2. Yoki to'g'ridan-to'g'ri `https://ai.iportal.uz` saytining **Hosting & AI Klaster** oynasidan kiritishingiz mumkin!
