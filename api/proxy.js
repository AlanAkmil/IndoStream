export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).send('Missing id');

  try {
    const response = await fetch(`https://www.dubbindo.site/embed/${id}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.dubbindo.site/',
        'Origin': 'https://www.dubbindo.site',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
      },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    let html = await response.text();

    // Fix relative URLs jadi absolute
    html = html
      .replace(/src="\/\//g, 'src="https://')
      .replace(/href="\/\//g, 'href="https://')
      .replace(/src="\//g, 'src="https://www.dubbindo.site/')
      .replace(/href="\//g, 'href="https://www.dubbindo.site/')
      .replace(/url\(\//g, 'url(https://www.dubbindo.site/');

    // Remove X-Frame-Options dari response (kita yang serve HTML-nya)
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.removeHeader('X-Frame-Options');
    res.send(html);
  } catch (err) {
    res.status(500).send(`<html><body style="background:#000;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;flex-direction:column;gap:12px"><p>Gagal memuat video</p><a href="https://www.dubbindo.site/embed/${id}" target="_blank" style="color:#e85d26;font-size:14px">Buka di tab baru</a></body></html>`);
  }
}
