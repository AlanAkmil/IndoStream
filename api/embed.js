// api/embed.js
// Fetch embed page dubbindo dan extract direct MP4 URLs

const BASE = 'https://uvideo.xyz';

export default async function handler(req, res) {
  const { id, color = 'c9a84c' } = req.query;

  if (!id) {
    return res.status(400).json({ status: 400, error: 'Video ID required' });
  }

  try {
    const embedUrl = `${BASE}/embed/${id}?color=${color}`;

    const response = await fetch(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
        'Referer': BASE,
      },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();

    // Extract all <source> tags
    const sourceRegex = /<source\s+src="([^"]+)"[^>]*data-quality="([^"]+)"[^>]*>/g;
    const sources = [];
    let match;

    while ((match = sourceRegex.exec(html)) !== null) {
      sources.push({
        url: match[1],
        quality: match[2],
      });
    }

    // Fallback: extract any S3 mp4 URL
    if (sources.length === 0) {
      const s3Regex = /https:\/\/s3\.dubbindo\.my\.id\/upload\/videos\/[^"'\s]+\.mp4/g;
      const s3Matches = html.match(s3Regex) || [];
      const seenUrls = new Set();
      for (const url of s3Matches) {
        if (seenUrls.has(url)) continue;
        seenUrls.add(url);
        const qualityGuess = url.includes('720p') ? '720p'
          : url.includes('480p') ? '480p'
          : url.includes('360p') ? '360p'
          : url.includes('240p') ? '240p' : 'auto';
        sources.push({ url, quality: qualityGuess });
      }
    }

    // Extract poster/thumbnail
    const posterMatch = html.match(/poster="([^"]+)"/);
    const poster = posterMatch ? posterMatch[1] : '';

    // Extract title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch ? titleMatch[1].replace(' - UVideo', '').trim() : '';

    // Sort by quality
    const qualityOrder = { '720p': 0, '480p': 1, '360p': 2, '240p': 3, 'auto': 4 };
    sources.sort((a, b) => (qualityOrder[a.quality] ?? 5) - (qualityOrder[b.quality] ?? 5));

    res.status(200).json({
      status: 200,
      id,
      title,
      poster,
      sources,
      embedUrl,
    });

  } catch (err) {
    res.status(500).json({ status: 500, error: err.message, sources: [] });
  }
}
