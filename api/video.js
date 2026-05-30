// api/video.js — follow redirect dan return final URL
export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  try {
    const decoded = decodeURIComponent(url);
    const response = await fetch(decoded, {
      method: 'HEAD',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.dubbindo.site/',
      },
    });

    // response.url adalah URL final setelah redirect
    const finalUrl = response.url || decoded;
    res.status(200).json({ url: finalUrl, status: response.status });
  } catch (err) {
    // Kalau gagal follow, return URL asli aja
    res.status(200).json({ url: decodeURIComponent(url), error: err.message });
  }
}
