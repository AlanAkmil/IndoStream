export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).send('Missing id');

  try {
    const response = await fetch(`https://www.dubbindo.site/embed/${id}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Referer': 'https://www.dubbindo.site/',
        'Origin': 'https://www.dubbindo.site',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
        'Cookie': req.headers.cookie || '',
      },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    let html = await response.text();

    // Fix relative URLs
    html = html
      .replace(/src="\/\//g, 'src="https://')
      .replace(/href="\/\//g, 'href="https://')
      .replace(/src="\//g, 'src="https://www.dubbindo.site/')
      .replace(/href="\//g, 'href="https://www.dubbindo.site/')
      .replace(/action="\//g, 'action="https://www.dubbindo.site/')
      .replace(/(url\(["']?)\//g, '$1https://www.dubbindo.site/');

    // Inject base tag so semua relative request ke dubbindo
    html = html.replace('<head>', '<head><base href="https://www.dubbindo.site/">');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    // Jangan set X-Frame-Options sama sekali biar bisa di-embed
    res.send(html);
  } catch (err) {
    res.status(500).send(`
      <html>
      <body style="background:#000;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;flex-direction:column;gap:16px;text-align:center;padding:20px">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e85d26" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p style="font-size:14px">Gagal memuat video</p>
        <a href="https://www.dubbindo.site/embed/${id}" target="_top" style="color:#e85d26;font-size:13px;border:1px solid #e85d26;padding:8px 20px;border-radius:8px;text-decoration:none">Buka di Tab Baru</a>
      </body>
      </html>
    `);
  }
}
