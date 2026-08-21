/**
 * ai.iportal.uz — Deno Deploy Edge Proxy Node (Hardened Security)
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const PROXY_SECRET = Deno.env.get("PROXY_SECRET") || "iportal-proxy-secret-token";

const ALLOWED_HOSTS = [
  "api.groq.com",
  "generativelanguage.googleapis.com",
  "api.sambanova.ai",
  "api.cerebras.ai",
  "openrouter.ai",
  "api.mistral.ai",
  "api.cloudflare.com",
  "router.huggingface.co",
  "api-inference.huggingface.co",
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({
        status: "online",
        node: "deno-deploy-proxy",
        timestamp: Date.now(),
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  // Secret token tekshiruvi
  const clientSecret = req.headers.get("X-Proxy-Secret");
  if (PROXY_SECRET && clientSecret !== PROXY_SECRET) {
    return new Response(
      JSON.stringify({ error: "Ruxsat yo'q: X-Proxy-Secret noto'g'ri" }),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const payload = await req.json();
    const { url, method = "POST", headers = {}, body } = payload;

    if (!url) {
      return new Response(
        JSON.stringify({ error: "url parametri ko'rsatilmadi" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // SSRF tekshiruvi
    const parsedUrl = new URL(url);
    const isAllowed = ALLOWED_HOSTS.some(h => parsedUrl.hostname === h || parsedUrl.hostname.endsWith(`.${h}`));
    if (!isAllowed) {
      return new Response(
        JSON.stringify({ error: "Ruxsatsiz nishon domen (SSRF Blocked)" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const forwardResp = await fetch(url, {
      method,
      headers,
      body: body ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
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
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "Deno Proxy xatoligi", message: err.message }),
      { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
