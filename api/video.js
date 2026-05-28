export default async function handler(req, res) {
  const { url } = req.query;
  if (!url || !url.startsWith('https://s3.dubbindo.my.id/upload/videos/')) {
    return res.status(403).send('Forbidden');
  }

  try {
    const range = req.headers.range;
    const headers = {
      'Referer': 'https://www.dubbindo.site/',
      'Origin': 'https://www.dubbindo.site',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
    };
    if (range) headers['Range'] = range;

    const response = await fetch(url, { headers });

    if (!response.ok && response.status !== 206) {
      return res.status(response.status).send('Failed');
    }

    // Forward headers
    res.setHeader('Content-Type', response.headers.get('content-type') || 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    const contentLength = response.headers.get('content-length');
    const contentRange = response.headers.get('content-range');
    if (contentLength) res.setHeader('Content-Length', contentLength);
    if (contentRange) res.setHeader('Content-Range', contentRange);

    res.status(range ? 206 : 200);

    // Stream response
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
}
