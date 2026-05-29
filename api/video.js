export const config = { api: { responseLimit: false } };

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url || !url.includes('dubbindo')) return res.status(403).send('Forbidden');

  const range = req.headers['range'];
  const headers = {
    'Referer': 'https://www.dubbindo.site/',
    'Origin': 'https://www.dubbindo.site',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
    'Accept': '*/*',
  };
  if (range) headers['Range'] = range;

  try {
    const upstream = await fetch(url, { headers, redirect: 'follow' });
    
    const status = upstream.status;
    if (status !== 200 && status !== 206) {
      return res.status(status).send('Upstream: ' + status);
    }

    const ct = upstream.headers.get('content-type') || 'video/mp4';
    const cl = upstream.headers.get('content-length');
    const cr = upstream.headers.get('content-range');

    res.setHeader('Content-Type', ct);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    if (cl) res.setHeader('Content-Length', cl);
    if (cr) res.setHeader('Content-Range', cr);
    res.status(range ? 206 : 200);

    // Stream response body
    const reader = upstream.body.getReader();
    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) { res.end(); break; }
        const ok = res.write(Buffer.from(value));
        if (!ok) await new Promise(r => res.once('drain', r));
      }
    };
    await pump();

  } catch(e) {
    if (!res.headersSent) res.status(500).send(e.message);
  }
}
