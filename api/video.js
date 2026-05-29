export default async function handler(req, res) {
  const { url } = req.query;
  if (!url || !url.includes('dubbindo')) return res.status(403).json({error:'Forbidden'});

  try {
    const upstream = await fetch(url, {
      method: 'HEAD',
      headers: {
        'Referer': 'https://www.dubbindo.site/',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120.0.0.0',
      },
      redirect: 'manual',
    });

    const location = upstream.headers.get('location');
    const finalUrl = location || url;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({ url: finalUrl });

  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
