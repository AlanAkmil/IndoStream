const BASE = 'https://www.dubbindo.site';

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
      'Referer': BASE,
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function parseVideos(html) {
  const videos = [];
  const watchRegex = /href="(https?:\/\/www\.dubbindo\.site\/watch\/([^"]+)_([a-zA-Z0-9]+)\.html)"/g;
  const seenIds = new Set();

  let match;
  while ((match = watchRegex.exec(html)) !== null) {
    const fullUrl = match[1];
    const slug = match[2];
    const videoId = match[3];

    if (seenIds.has(videoId)) continue;
    seenIds.add(videoId);

    const start = Math.max(0, match.index - 800);
    const ctx = html.slice(start, match.index + fullUrl.length + 400);

    const thumbMatch = ctx.match(/src="(https:\/\/s3\.dubbindo\.my\.id\/upload\/[^"]+)"/);
    const thumb = thumbMatch ? thumbMatch[1] : '';

    const titleMatch = ctx.match(/title="([^"]{3,150})"/) || ctx.match(/alt="([^"]{3,150})"/);
    const title = titleMatch ? titleMatch[1] : slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    const viewsMatch = ctx.match(/<span>(\d[\d.,]*)\s*Views?<\/span>/i);
    const views = viewsMatch ? viewsMatch[1] : '0';

    const timeMatch = ctx.match(/<span>([^<]*(?:second|minute|hour|day|week|month|year|ago)[^<]*)<\/span>/i);
    const date = timeMatch ? timeMatch[1].trim() : '2026';

    if (videoId && title) {
      videos.push({ id: videoId, title, thumb, views, date, catName: 'Dubbing Indonesia', url: fullUrl });
    }
  }

  return videos;
}

export default async function handler(req, res) {
  const { q, page = 1 } = req.query;
  if (!q) return res.status(400).json({ status: 400, error: 'Query required', videos: [] });

  try {
    const url = `${BASE}/search?keyword=${encodeURIComponent(q)}&page_id=${page}`;
    const html = await fetchPage(url);
    const videos = parseVideos(html);
    res.status(200).json({ status: 200, query: q, page: parseInt(page), total: videos.length, videos });
  } catch (err) {
    res.status(500).json({ status: 500, error: err.message, videos: [] });
  }
}
