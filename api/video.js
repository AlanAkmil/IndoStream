export default async function handler(req, res) {
  const { url } = req.query;
  if (!url || !url.includes('dubbindo')) return res.status(403).send('Forbidden');

  try {
    // Fetch HEAD dulu buat dapet redirect URL ke wasabisys
    const upstream = await fetch(url, {
      method: 'HEAD',
      headers: {
        'Referer': 'https://www.dubbindo.site/',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120.0.0.0',
      },
      redirect: 'manual', // Jangan ikut redirect, ambil URL-nya
    });

    const location = upstream.headers.get('location');
    if (location) {
      // Redirect browser langsung ke wasabisys - browser bisa stream sendiri
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.redirect(302, location);
    }

    // Kalau gak ada redirect, redirect ke URL asli
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.redirect(302, url);

  } catch(e) {
    res.status(500).send(e.message);
  }
}
