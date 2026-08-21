# ai.iportal.uz Domenini Bepul Sozlash Qo'llanmasi

Ushbu qo'llanmada loyihani bepul hostingga joylab, o'zingizning `ai.iportal.uz` domeningizni ulash bosqichlari ko'rsatilgan.

---

## 1-qadam: Asosiy Saytni Vercel ga Joylash (100% Bepul)
1. Ushbu loyihani GitHub reposingizga yuklang (`git push`).
2. [Vercel.com](https://vercel.com) saytiga kiring va GitHub orqali ro'yxatdan o'ting.
3. **Add New...** &gt; **Project** tugmasini bosing va ushbu repozitoriyani tanlang.
4. **Environment Variables** bo'limiga `.env.example` dagi kalitlaringizni kiriting:
   - `IPORTAL_MASTER_KEY`
   - `GROQ_API_KEYS`
   - `GEMINI_API_KEYS`
   - `SAMBANOVA_API_KEYS`
   - `WORKER_URLS`
5. **Deploy** tugmasini bosing. Loyiha 1 daqiqada ishga tushadi.

---

## 2-qadam: ai.iportal.uz Domenini Ulash
1. Vercel dashboardida loyihangizga kiring.
2. **Settings** &gt; **Domains** bo'limiga o'ting.
3. Qidiruv qatoriga `ai.iportal.uz` deb yozing va **Add** bosing.
4. Vercel sizga DNS yozuvini ko'rsatadi:
   - **Type:** `CNAME`
   - **Name:** `ai`
   - **Value:** `cname.vercel-dns.com`

---

## 3-qadam: DNS Sozlamalarini O'zgartirish (Cloudflare yoki iportal.uz DNS)
1. `iportal.uz` domeni boshqariladigan DNS paneliga (masalan Cloudflare DNS) kiring.
2. Yangi DNS yozuvini qo'shing:
   - **Type:** `CNAME`
   - **Name:** `ai`
   - **Target:** `cname.vercel-dns.com`
   - **Proxy status:** DNS Only yoki Proxied (Cloudflare SSL bilan)
3. Saqlang. 2-5 daqiqa ichida `https://ai.iportal.uz` to'liq bepul SSL sertifikati bilan ishga tushadi!
