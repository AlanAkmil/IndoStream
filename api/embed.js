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

    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch ? titleMatch[1].replace(/\s*\|.*$/, '').trim() : '';

    const sources = [];

    // Match MP4 sources from video player config
    const mp4Regex = /["']?file["']?\s*:\s*["']([^"']+\.mp4[^"']*)/gi;
    let m;
    const seenUrls = new Set();
    while ((m = mp4Regex.exec(html)) !== null) {
      if (!seenUrls.has(m[1])) {
        seenUrls.add(m[1]);
        const labelMatch = html.slice(Math.max(0, m.index - 100), m.index).match(/["']?label["']?\s*:\s*["']([^"']+)/i);
        sources.push({ quality: labelMatch ? labelMatch[1] : `Kualitas ${sources.length + 1}`, url: m[1] });
      }
    }

    // Match HLS/m3u8
    const hlsRegex = /["']?file["']?\s*:\s*["']([^"']+\.m3u8[^"']*)/gi;
    while ((m = hlsRegex.exec(html)) !== null) {
      if (!seenUrls.has(m[1])) {
        seenUrls.add(m[1]);
        sources.push({ quality: 'Auto (HLS)', url: m[1] });
      }
    }

    // Match iframe embed
    const iframeMatch = html.match(/<iframe[^>]+src="([^"]+)"[^>]*(allow|allowfullscreen)/i);
    if (iframeMatch && sources.length === 0) {
      sources.push({ quality: 'Stream', url: iframeMatch[1] });
    }

    res.status(200).json({ status: 200, id, title, sources });
  } catch (err) {
    res.status(500).json({ status: 500, error: err.message, sources: [] });
  }
}
