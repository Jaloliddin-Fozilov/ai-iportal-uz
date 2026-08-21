/**
 * ai.iportal.uz — Cloudflare Worker Reverse Proxy Node (Hardened Security)
 */

const ALLOWED_HOSTS = [
  'api.groq.com',
  'generativelanguage.googleapis.com',
  'api.sambanova.ai',
  'api.cerebras.ai',
  'openrouter.ai',
  'api.mistral.ai',
  'api.cloudflare.com',
  'router.huggingface.co',
  'api-inference.huggingface.co',
];

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (request.method === 'GET') {
      return new Response(
        JSON.stringify({
          status: 'online',
          node: 'cloudflare-worker-proxy',
          region: request.cf?.colo || 'global',
          timestamp: Date.now(),
        }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // 1. Secret token tekshiruvi (faqat ai.iportal.uz so'rovlariga ruxsat)
    const expectedSecret = env.PROXY_SECRET || 'iportal-proxy-secret-token';
    const clientSecret = request.headers.get('X-Proxy-Secret');

    if (expectedSecret && clientSecret !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: 'Ruxsat yo\'q: Noto\'g\'ri X-Proxy-Secret' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    try {
      const payload = await request.json();
      const { url, method = 'POST', headers = {}, body } = payload;

      if (!url) {
        return new Response(
          JSON.stringify({ error: 'Nishon "url" ko\'rsatilmadi' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // 2. SSRF Protection: Faqat ruxsat etilgan AI domenlarga yo'naltirish
      const parsedUrl = new URL(url);
      const isAllowed = ALLOWED_HOSTS.some(h => parsedUrl.hostname === h || parsedUrl.hostname.endsWith(`.${h}`));
      if (!isAllowed) {
        return new Response(
          JSON.stringify({ error: 'Ruxsatsiz nishon domen (SSRF Blocked)' }),
          { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Forward to target AI provider
      const forwardResp = await fetch(url, {
        method,
        headers,
        body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
      });

      const responseHeaders = new Headers(forwardResp.headers);
      for (const [key, value] of Object.entries(corsHeaders)) {
        responseHeaders.set(key, value);
      }

      return new Response(forwardResp.body, {
        status: forwardResp.status,
        statusText: forwardResp.statusText,
        headers: responseHeaders,
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: 'Worker Proxy xatoligi', message: err.message }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
  },
};
