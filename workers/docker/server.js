/**
 * ai.iportal.uz — Node.js Standalone Proxy Node
 * 
 * Render, Koyeb, Hugging Face Spaces, Fly.io yoki istalgan bepul VPS/PaaS da ishlaydi.
 */

const http = require('http');

const PORT = process.env.PORT || 8080;
const PROXY_SECRET = process.env.PROXY_SECRET || 'iportal-proxy-secret-token';

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'online', node: 'node-docker-proxy', timestamp: Date.now() }));
    return;
  }

  // Secret check
  const clientSecret = req.headers['x-proxy-secret'];
  if (PROXY_SECRET && clientSecret !== PROXY_SECRET) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Ruxsat yo\'q: X-Proxy-Secret noto\'g\'ri' }));
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Faqat POST metod qabul qilinadi' }));
    return;
  }

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    try {
      const payload = JSON.parse(body || '{}');
      const { url, method = 'POST', headers = {}, body: forwardBody } = payload;

      if (!url) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'url ko\'rsatilmadi' }));
        return;
      }

      const forwardResp = await fetch(url, {
        method,
        headers,
        body: forwardBody ? (typeof forwardBody === 'string' ? forwardBody : JSON.stringify(forwardBody)) : undefined,
      });

      res.writeHead(forwardResp.status, {
        ...Object.fromEntries(forwardResp.headers.entries()),
        'Access-Control-Allow-Origin': '*',
      });

      if (forwardResp.body) {
        const reader = forwardResp.body.getReader();
        const pump = async () => {
          const { done, value } = await reader.read();
          if (done) {
            res.end();
            return;
          }
          res.write(value);
          await pump();
        };
        await pump();
      } else {
        res.end();
      }
    } catch (err) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Node proxy xatoligi', message: err.message }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`[iportal-proxy] Node worker running on port ${PORT}`);
});
