module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body);
    const { system, message } = body;
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) return res.status(500).json({ error: 'no key' });

    const https = require('https');
    const data = JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      system: system || '',
      messages: [{ role: 'user', content: message }],
    });

    return new Promise((resolve) => {
      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
      };
      const req2 = https.request(options, (r) => {
        let d = '';
        r.on('data', c => d += c);
        r.on('end', () => {
          try { resolve(res.status(200).json(JSON.parse(d))); }
          catch(e) { resolve(res.status(500).json({ error: 'parse error' })); }
        });
      });
      req2.on('error', e => resolve(res.status(500).json({ error: e.message })));
      req2.write(data);
      req2.end();
    });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};
