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

  // Cari bagian yang ada link watch-nya
  const watchIdx = html.indexOf('/watch/');
  const snippet = watchIdx > -1
    ? html.slice(Math.max(0, watchIdx - 1000), watchIdx + 3000)
    : html.slice(8000, 16000);

  res.setHeader('Content-Type', 'text/plain');
  res.send(`TOTAL LENGTH: ${html.length}\nWATCH IDX: ${watchIdx}\n\n---SNIPPET---\n${snippet}`);
}