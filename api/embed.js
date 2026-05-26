const BASE = 'https://www.dubbindo.site';

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ status: 400, error: 'ID required' });

  try {
    const url = `${BASE}/watch/${id}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
        'Referer': BASE,
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();

    // Try h-cdn.com embed player
    const hcdnMatch = html.match(/player\.h-cdn\.com[^"']*/);
    if (hcdnMatch) {
      return res.status(200).json({ status: 200, type: 'hcdn', embedUrl: `https://${hcdnMatch[0]}` });
    }

    // Try iframe embed src
    const iframeMatch = html.match(/<iframe[^>]+src="([^"]+)"[^>]*>/i);
    if (iframeMatch) {
      return res.status(200).json({ status: 200, type: 'iframe', embedUrl: iframeMatch[1] });
    }

    // Try direct video source
    const videoSrcMatch = html.match(/file:\s*["']([^"']+\.mp4[^"']*)/i) ||
                          html.match(/src:\s*["']([^"']+\.mp4[^"']*)/i) ||
                          html.match(/<source[^>]+src="([^"]+\.mp4[^"]*)"/i);
    if (videoSrcMatch) {
      return res.status(200).json({ status: 200, type: 'mp4', embedUrl: videoSrcMatch[1] });
    }

    // Fallback: return watch page URL
    res.status(200).json({ status: 200, type: 'page', embedUrl: url });
  } catch (err) {
    res.status(500).json({ status: 500, error: err.message });
  }
}
