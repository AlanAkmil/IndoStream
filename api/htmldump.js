const BASE = 'https://www.dubbindo.site';

export default async function handler(req, res) {
  const response = await fetch(`${BASE}/videos/latest?page_id=1`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': BASE,
    },
  });
  const html = await response.text();

  // Cari index pertama dubbindo.site/watch
  const idx = html.indexOf('dubbindo.site/watch');
  const snippet = html.slice(Math.max(0, idx - 200), idx + 2000);

  res.setHeader('Content-Type', 'text/plain');
  res.send(`LEN: ${html.length} | IDX: ${idx}\n\n${snippet}`);
}