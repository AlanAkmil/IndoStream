export const config = { api: { responseLimit: '50mb' } };

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url || !url.includes('dubbindo')) return res.status(403).send('Forbidden');

  const range = req.headers['range'];
  const headers = {
    'Referer': 'https://www.dubbindo.site/',
    'Origin': 'https://www.dubbindo.site',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
  };
  if (range) headers['Range'] = range;

  try {
    const upstream = await fetch(url, { headers });
    if (!upstream.ok && upstream.status !== 206) {
      // Follow redirect manually
      const loc = upstream.headers.get('location');
      if (loc) return res.redirect(302, loc);
      return res.status(upstream.status).send('Upstream error');
    }

    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const cl = upstream.headers.get('content-length');
    const cr = upstream.headers.get('content-range');
    if (cl) res.setHeader('Content-Length', cl);
    if (cr) res.setHeader('Content-Range', cr);
    res.status(range ? 206 : 200);

    const buf = await upstream.arrayBuffer();
    res.end(Buffer.from(buf));
  } catch(e) {
    res.status(500).send(e.message);
  }
}
