// api/detail.js
// Scrape halaman detail series/movie dari dubbindo

const BASE = 'https://www.dubbindo.site';

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ status: 400, error: 'URL required' });
  }

  try {
    const fullUrl = url.startsWith('http') ? url : `${BASE}/${url}`;

    const response = await fetch(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
        'Referer': BASE,
      },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();

    // Title
    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/) || html.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch ? titleMatch[1].replace(' - Dubbindo', '').trim() : '';

    // Poster/thumb
    const posterMatch = html.match(/src="(https:\/\/s3\.dubbindo\.my\.id\/upload\/photos\/[^"]+)"/);
    const poster = posterMatch ? posterMatch[1] : '';

    // Embed ID on page (if direct video page)
    const embedMatch = html.match(/\/embed\/([a-zA-Z0-9]+)/);
    const embedId = embedMatch ? embedMatch[1] : '';

    // All episode links
    const epRegex = /href="(https?:\/\/www\.dubbindo\.site\/watch\/([^"]+)_([a-zA-Z0-9]+)\.html)"/g;
    const episodes = [];
    const seenIds = new Set();
    let epMatch;

    while ((epMatch = epRegex.exec(html)) !== null) {
      const epUrl = epMatch[1];
      const epSlug = epMatch[2];
      const epId = epMatch[3];
      if (seenIds.has(epId)) continue;
      seenIds.add(epId);

      // Try get ep number
      const numMatch = epSlug.match(/episode[-_]?(\d+)/i);
      const epNum = numMatch ? parseInt(numMatch[1]) : episodes.length + 1;

      // Context for thumb
      const start = Math.max(0, epMatch.index - 300);
      const ctx = html.slice(start, epMatch.index + 200);
      const thumbMatch = ctx.match(/src="(https:\/\/s3\.dubbindo\.my\.id\/upload\/photos\/[^"]+)"/);
      const thumb = thumbMatch ? thumbMatch[1] : poster;

      episodes.push({ id: epId, epNum, title: epSlug.replace(/-/g, ' '), url: epUrl, thumb });
    }

    // Sort episodes
    episodes.sort((a, b) => a.epNum - b.epNum);

    // Status (ongoing/completed)
    const ongoingMatch = html.match(/ongoing|sedang tayang/i);
    const status = ongoingMatch ? 'ongoing' : 'completed';

    // Genre/tags
    const genreMatch = html.match(/genre[^>]*>([^<]+)</i);
    const genre = genreMatch ? genreMatch[1].trim() : '';

    res.status(200).json({
      status: 200,
      title,
      poster,
      embedId,
      seriesStatus: status,
      genre,
      episodeCount: episodes.length,
      episodes,
    });

  } catch (err) {
    res.status(500).json({ status: 500, error: err.message });
  }
}