// api/image.js — proxy gambar dari s3.dubbindo.my.id
export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).send('Missing url');

  try {
    const r = await fetch(decodeURIComponent(url), {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://www.dubbindo.site/',
      },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const ct = r.headers.get('content-type') || 'image/jpeg';
    const buf = await r.arrayBuffer();
    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(buf));
  } catch (err) {
    res.status(500).send('Error');
  }
}
