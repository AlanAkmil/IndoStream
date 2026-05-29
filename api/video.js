export const config = { api: { responseLimit: false } };

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url || !url.startsWith('https://s3.dubbindo.my.id/upload/videos/')) {
    return res.status(403).send('Forbidden');
  }

  try {
    const range = req.headers['range'];
    const reqHeaders = {
      'Referer': 'https://www.dubbindo.site/',
      'Origin': 'https://www.dubbindo.site',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
      'Accept': '*/*',
    };
    if (range) reqHeaders['Range'] = range;

    const response = await fetch(url, { headers: reqHeaders });
    const status = response.status;

    if (status !== 200 && status !== 206) {
      return res.status(status).send('Upstream error: ' + status);
    }

    // Forward relevant headers
    const ct = response.headers.get('content-type');
    const cl = response.headers.get('content-length');
    const cr = response.headers.get('content-range');

    res.setHeader('Content-Type', ct || 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (cl) res.setHeader('Content-Length', cl);
    if (cr) res.setHeader('Content-Range', cr);

    res.status(range ? 206 : 200);

    // Stream chunk by chunk
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).send('Error: ' + err.message);
    }
  }
}
