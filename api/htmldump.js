const BASE = 'https://www.dubbindo.site';

export default async function handler(req, res) {
  const { id } = req.query || 'ZzirhOiP65l9uW2';
  const response = await fetch(`${BASE}/embed/${id || 'ZzirhOiP65l9uW2'}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
      'Referer': 'https://www.dubbindo.site/',
      'Origin': 'https://www.dubbindo.site',
    },
  });
  const html = await response.text();
  res.setHeader('Content-Type', 'text/plain');
  res.send(html.slice(0, 6000));
}