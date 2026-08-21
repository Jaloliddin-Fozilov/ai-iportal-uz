/**
 * ai.iportal.uz — Vercel Serverless / Edge Proxy Node
 */

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({
        status: 'online',
        node: 'vercel-edge-proxy',
        timestamp: Date.now(),
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  const secret = process.env.PROXY_SECRET || 'iportal-proxy-secret-token';
  const clientSecret = req.headers.get('X-Proxy-Secret');

  if (secret && clientSecret !== secret) {
    return new Response(
      JSON.stringify({ error: 'Ruxsat yo\'q: X-Proxy-Secret noto\'g\'ri' }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  try {
    const payload = await req.json();
    const { url, method = 'POST', headers = {}, body } = payload;

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'url ko\'rsatilmadi' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

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
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: 'Vercel Edge Proxy xatoligi', message: err.message }),
      { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}
