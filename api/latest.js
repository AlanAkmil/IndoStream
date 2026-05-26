// api/latest.js
const BASE = 'https://www.dubbindo.site';

const CATEGORY_MAP = {
  '1': 'Film Movie',
  '3': 'TV Series',
  '4': 'Anime Movie',
  '5': 'Anime Series',
};

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
  // Match watch URLs: /watch/slug_ID.html
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
    const ctx = html.slice(start, match.index + fullUrl.length + 300);

    // Thumbnail from s3.dubbindo.my.id
    const thumbMatch = ctx.match(/src="(https:\/\/s3\.dubbindo\.my\.id\/upload\/photos\/[^"]+)"/);
    const thumb = thumbMatch ? thumbMatch[1] : '';

    // Title from h4 title attribute or alt attribute
    const titleH4Match = ctx.match(/title="([^"]{3,150})"/);
    const titleAltMatch = ctx.match(/alt="([^"]{3,150})"/);
    let title = '';
    if (titleH4Match) title = titleH4Match[1];
    else if (titleAltMatch) title = titleAltMatch[1];
    else title = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    // Views
    const viewsMatch = ctx.match(/(\d[\d.,]*)\s*Views?/i);
    const views = viewsMatch ? viewsMatch[1] : '0';

    // Duration
    const durationMatch = ctx.match(/class="video-duration">([^<]+)<\/div>/);
    const duration = durationMatch ? durationMatch[1].trim() : '';

    if (videoId && title) {
      videos.push({ id: videoId, title, thumb, views, duration, url: fullUrl });
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

    // Pagination
    const totalPagesMatch = html.match(/page_id=(\d+)[^"]*"[^>]*>[^<]*<\/a>\s*<\/li>\s*<li>\s*<a[^>]*title='Last Page'/);
    const totalPages = totalPagesMatch ? parseInt(totalPagesMatch[1]) : 1;

    res.status(200).json({
      status: 200,
      page: parseInt(page),
      category,
      total: videos.length,
      totalPages,
      videos,
    });
  } catch (err) {
    res.status(500).json({ status: 500, error: err.message, videos: [] });
  }
}
