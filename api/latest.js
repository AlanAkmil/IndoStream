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
  const watchRegex = /href="https?:\/\/www\.dubbindo\.site\/watch\/([^"]+\.html)"/g;
  const seenIds = new Set();

  let match;
  while ((match = watchRegex.exec(html)) !== null) {
    const fullSlug = match[1];
    if (seenIds.has(fullSlug)) continue;
    seenIds.add(fullSlug);

    const start = Math.max(0, match.index - 800);
    const ctx = html.slice(start, match.index + fullSlug.length + 400);

    const thumbMatch = ctx.match(/src="(https:\/\/s3\.dubbindo\.my\.id\/upload\/photos\/[^"]+)"/);
    const thumb = thumbMatch ? thumbMatch[1] : '';

    const titleMatch = ctx.match(/title="([^"]{3,150})"/) || ctx.match(/alt="([^"]{3,150})"/);
    const rawTitle = titleMatch ? titleMatch[1].replace(/^⁣/, '').trim() : fullSlug.replace(/_[^_]+\.html$/, '').replace(/-/g, ' ');
    const title = rawTitle;

    const viewsMatch = ctx.match(/<span>([\d,]+)\s*Views?<\/span>/i);
    const views = viewsMatch ? viewsMatch[1] : '0';

    const durationMatch = ctx.match(/class="video-duration">([^<]+)<\/div>/);
    const duration = durationMatch ? durationMatch[1].trim() : '';

    const timeMatch = ctx.match(/<span>([^<]*(?:second|minute|hour|day|week|month|year|ago|detik|menit|jam|hari)[^<]*)<\/span>/i);
    const date = timeMatch ? timeMatch[1].trim() : '2026';

    if (title) {
      videos.push({
        id: fullSlug,
        title,
        thumb,
        views,
        duration,
        date,
        catName: 'Dubbing Indonesia',
      });
    }
  }

  return videos;
}

export default async function handler(req, res) {
  const { category = 'all', page = 1 } = req.query;

  try {
    let url;
    if (category === 'all') {
      url = `${BASE}/videos/latest?page_id=${page}`;
    } else {
      url = `${BASE}/videos/category/${category}?page_id=${page}`;
    }

    const html = await fetchPage(url);
    const videos = parseVideos(html);

    res.status(200).json({ status: 200, page: parseInt(page), category, total: videos.length, videos });
  } catch (err) {
    res.status(500).json({ status: 500, error: err.message, videos: [] });
  }
}
