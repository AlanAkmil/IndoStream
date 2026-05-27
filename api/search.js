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
  const seenIds = new Set();

  const watchRegex = /href="https?:\/\/www\.dubbindo\.site\/watch\/([^"]+\.html)"/g;
  let match;

  while ((match = watchRegex.exec(html)) !== null) {
    const fullSlug = match[1];
    if (seenIds.has(fullSlug)) continue;
    seenIds.add(fullSlug);

    // Context 1500 char setelah href (thumbnail ada di dalam <a> = setelah href)
    const after = html.slice(match.index, match.index + 1500);

    // Potong context tepat sebelum link profil uploader
    // Profil uploader selalu ada tag <a href="/@username"> atau data-load="?link1=timeline"
    const cutIdx = after.search(/href="https?:\/\/www\.dubbindo\.site\/@/);
    const safeCtx = cutIdx > 50 ? after.slice(0, cutIdx) : after.slice(0, 600);

    // Thumbnail: img pertama di safeCtx
    const thumbMatch = safeCtx.match(/src="(https:\/\/s3\.dubbindo\.my\.id\/upload\/photos\/[^"]+)"/);
    const thumb = thumbMatch ? thumbMatch[1] : '';

    // Title dari h4 (ada di after penuh)
    const titleMatch = after.match(/<h4 title="([^"]{3,150})"/) || after.match(/alt="([^"]{3,150})"/);
    const title = titleMatch
      ? titleMatch[1].replace(/^⁣/, '').trim()
      : fullSlug.replace(/_[^_]+\.html$/, '').replace(/-/g, ' ');

    // Views
    const viewsMatch = after.match(/<span>([\d,]+)\s*Views?<\/span>/i);
    const views = viewsMatch ? viewsMatch[1] : '0';

    // Date
    const timeMatch = after.match(/<span>([^<]*(?:second|minute|hour|day|week|month|year|ago|detik|menit|jam|hari)[^<]*)<\/span>/i);
    const date = timeMatch ? timeMatch[1].trim() : '2026';

    if (title) {
      videos.push({ id: fullSlug, title, thumb, views, date, catName: 'Dubbing Indonesia' });
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
