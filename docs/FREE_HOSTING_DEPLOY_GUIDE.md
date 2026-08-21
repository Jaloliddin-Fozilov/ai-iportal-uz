# Bepul Hostinglarga Taqsimlangan Worker Proxylarni Joylash Qo'llanmasi

Bepul AI provayderlar bitta server IP sidan ko'p so'rov tushganda bloklamasligi uchun, so'rovlarni bir nechta turli bepul hostinglar orqali o'tkazamiz.

---

## 1. Cloudflare Workers (100,000 so'rov/kun bepul)
1. [https://dash.cloudflare.com](https://dash.cloudflare.com) ga kiring.
2. **Workers & Pages** &gt; **Create Application** &gt; **Create Worker** bosing.
3. Loyihadagi `workers/cloudflare/index.js` kodi nusxasini to'liq joylashtiring.
4. **Deploy** tugmasini bosing.
5. Sozlamalardan (Settings &gt; Variables) `PROXY_SECRET` o'zgaruvchisini kiriting: `iportal-proxy-secret-token`.
6. Chiqqan URL manzilini oling (masalan: `https://iportal-proxy.your-name.workers.dev`).

## 2. Deno Deploy (100,000 so'rov/kun bepul)
1. [https://dash.deno.com](https://dash.deno.com) ga kiring.
2. **New Project** &gt; **Playground** yoki GitHub repo orqali yangi loyiha yarating.
3. Loyihadagi `workers/deno/server.ts` kodini joylashtiring.
4. Settings &gt; Environment Variables bo'limiga `PROXY_SECRET=iportal-proxy-secret-token` qo'shing.
5. URL manzilini nusxalang (masalan: `https://iportal-proxy.deno.dev`).

## 3. Vercel Edge Functions (Cheksiz bepul)
1. [https://vercel.com](https://vercel.com) da `workers/vercel` papkasini yangi loyiha qilib deploy qiling.
2. URL manzilini oling (masalan: `https://iportal-proxy.vercel.app/api/proxy`).

## 4. Render / Koyeb / Hugging Face Spaces (Docker Free)
1. `workers/docker` papkasidagi `Dockerfile` va `server.js` orqali Render yoki Koyeb da bepul Web Service oching.
2. Port: 8080.
3. URL manzilini oling.

---

## Barcha Workerlarni ai.iportal.uz ga Ulash
Barcha olingan URL manzillarni saytingiz boshqaruv panelidagi **Hosting & AI Klaster** oynasida **Node Qo'shish** orqali kiriting yoki `.env` da yozing:
```env
WORKER_URLS=https://iportal-proxy.workers.dev,https://iportal-proxy.deno.dev,https://iportal-proxy.vercel.app/api/proxy
```

Tizim avtomatik ravishda so'rovlarni ushbu serverlarning turli IP lari bo'ylab taqsimlaydi va 100% uzluksiz, bloklanishlarsiz ishlashni ta'minlaydi!
