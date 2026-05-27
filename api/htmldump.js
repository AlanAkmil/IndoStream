const BASE = 'https://www.dubbindo.site';

export default async function handler(req, res) {
  const response = await fetch(`${BASE}/videos/latest?page_id=1`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': BASE,
    },
  });
  const html = await response.text();

  const idx = html.indexOf('dubbindo.site/watch');
  const raw = html.slice(idx - 5, idx + 100);

  // Cek apakah ada karakter aneh
  const hex = Buffer.from(raw).toString('hex');

  res.setHeader('Content-Type', 'text/plain');
  res.send(`IDX: ${idx}\nRAW: ${raw}\nHEX: ${hex}`);
}