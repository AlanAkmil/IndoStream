const BASE = 'https://www.dubbindo.site';

export default async function handler(req, res) {
  const { q } = req.query;
  const url = q
    ? `${BASE}/search?keyword=${encodeURIComponent(q)}&page_id=1`
    : `${BASE}/videos/latest?page_id=1`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': BASE,
    },
  });
  const html = await response.text();
  res.setHeader('Content-Type', 'text/plain');
  res.send(html.slice(0, 8000));
}