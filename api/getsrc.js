// api/getsrc.js — fetch watch page dan return URL video terbaik
const BASE = 'https://www.dubbindo.site';

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'ID required' });

  try {
    // Cari full slug dari latest jika id adalah shortcode
    const watchUrl = `${BASE}/watch/${id}`;
    const response = await fetch(watchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': BASE,
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();

    // Parse <source> tags
    const sourceRegex = /<source\s+[^>]*src="(https?:\/\/[^"]+\.mp4[^"]*)"[^>]*>/gi;
    const sources = [];
    let m;
    while ((m = sourceRegex.exec(html)) !== null) {
      const tag = m[0];
      const labelMatch = tag.match(/label='([^']+)'/) || tag.match(/label="([^"]+)"/) || tag.match(/data-quality="([^"]+)"/);
      const quality = labelMatch ? labelMatch[1] : '';
      sources.push({ quality, url: m[1] });
    }

    if (sources.length === 0) throw new Error('No sources found');

    // Return 720p atau kualitas tertinggi
    const preferred = sources.find(s => s.quality === '720p') || sources[0];
    res.status(200).json({ src: preferred.url, quality: preferred.quality, all: sources });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
