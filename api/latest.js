// api/latest.js
// Scrape latest videos dari dubbindo.site

const BASE = 'https://uvideo.xyz';

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

  // Match each video item block
  const itemRegex = /<div[^>]+class="[^"]*video-item[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/g;
  const thumbRegex = /<img[^>]+src="([^"]+)"/;
  const titleRegex = /<h[23][^>]*>\s*<a[^>]*>([^<]+)<\/a>/;
  const linkRegex = /href="([^"]+\/watch\/[^"]+)"/;
  const categoryRegex = /\/videos\/category\/(\d+)/;
  const viewsRegex = /(\d[\d.,]*)\s*(?:views?|x ditonton)/i;
  const dateRegex = /(\d{2}\/\d{2}\/\d{2,4}|\d{4}-\d{2}-\d{2})/;

  // Alternative: parse anchor tags with watch URLs
  const watchRegex = /href="(https?:\/\/(?:www\.)?uvideo\.xyz\/watch\/([^"]+)_([a-zA-Z0-9]+)\.html)"/g;
  const seenIds = new Set();

  let match;
  while ((match = watchRegex.exec(html)) !== null) {
    const fullUrl = match[1];
    const slug = match[2];
    const videoId = match[3];

    if (seenIds.has(videoId)) continue;
    seenIds.add(videoId);

    // Get surrounding context (500 chars before the match)
    const start = Math.max(0, match.index - 600);
    const ctx = html.slice(start, match.index + fullUrl.length + 200);

    // Extract thumbnail
    const thumbMatch = ctx.match(/src="(https:\/\/s3\.dubbindo\.my\.id\/upload\/photos\/[^"]+)"/);
    const thumb = thumbMatch ? thumbMatch[1] : '';

    // Extract title from title="" or alt="" or anchor text
    const titleAttrMatch = ctx.match(/(?:title|alt)="([^"]{5,100})"/);
    const anchorTextMatch = ctx.match(/<a[^>]*href="[^"]*watch[^"]*"[^>]*>\s*([^<]{5,100})\s*<\/a>/);
    let title = '';
    if (titleAttrMatch) title = titleAttrMatch[1];
    else if (anchorTextMatch) title = anchorTextMatch[1].trim();
    else title = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    // Extract category
    const catMatch = ctx.match(/\/videos\/category\/(\d+)/);
    const catId = catMatch ? catMatch[1] : '0';
    const catName = CATEGORY_MAP[catId] || 'Video';

    // Extract views
    const viewsMatch = ctx.match(/(\d[\d.,]*)\s*x\s*ditonton/i) || ctx.match(/(\d[\d.,]*)\s*views/i);
    const views = viewsMatch ? viewsMatch[1] : '0';

    // Extract date
    const dateMatch = ctx.match(/(\d{2}\/\d{2}\/\d{2,4})/);
    const date = dateMatch ? dateMatch[1] : '';

    if (videoId && title) {
      videos.push({ id: videoId, title, thumb, catId, catName, views, date, url: fullUrl });
    }
  }

  return videos;
}

export default async function handler(req, res) {
  const { category = 'all', page = 1 } = req.query;

  try {
    let url;
    if (category === 'all') {
      url = `${BASE}/videos/latest?page=${page}`;
    } else {
      url = `${BASE}/videos/category/${category}?page=${page}`;
    }

    const html = await fetchPage(url);
    const videos = parseVideos(html);

    // Also try to get pagination info
    const totalMatch = html.match(/Total[^:]*:\s*(\d+)/i);
    const total = totalMatch ? parseInt(totalMatch[1]) : videos.length;

    res.status(200).json({
      status: 200,
      page: parseInt(page),
      category,
      total,
      videos,
    });
  } catch (err) {
    res.status(500).json({ status: 500, error: err.message, videos: [] });
  }
}
