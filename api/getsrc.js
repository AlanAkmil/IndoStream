const BASE = 'https://www.dubbindo.site';

async function fetchHtml(url) {
  const r = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': BASE,
    },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

function parseSources(html) {
  const sources = [];
  const sourceRegex = /<source\s+[^>]*src="(https?:\/\/[^"]+\.mp4[^"]*)"[^>]*>/gi;
  let m;
  while ((m = sourceRegex.exec(html)) !== null) {
    const tag = m[0];
    const labelMatch = tag.match(/label='([^']+)'/) || tag.match(/label="([^"]+)"/) || tag.match(/data-quality="([^"]+)"/);
    sources.push({ quality: labelMatch ? labelMatch[1] : `Q${sources.length+1}`, url: m[1] });
  }
  return sources;
}

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'ID required' });

  try {
    // id bisa berupa shortcode atau full slug
    // Coba langsung sebagai full slug dulu
    let html, watchUrl;

    if (id.includes('_') || id.endsWith('.html')) {
      // Kemungkinan full slug
      const slug = id.endsWith('.html') ? id : id + '.html';
      watchUrl = `${BASE}/watch/${slug}`;
      html = await fetchHtml(watchUrl);
    } else {
      // Shortcode saja — cari di search/latest untuk dapet full slug
      // Coba langsung tebak dengan search di HTML latest
      const searchHtml = await fetchHtml(`${BASE}/videos/latest?page_id=1`);
      const slugMatch = searchHtml.match(new RegExp(`href="https?://www\\.dubbindo\\.site/watch/([^"]+_${id}\\.html)"`));
      if (slugMatch) {
        watchUrl = `${BASE}/watch/${slugMatch[1]}`;
        html = await fetchHtml(watchUrl);
      } else {
        // Fallback: coba langsung pakai shortcode (mungkin ada redirect)
        watchUrl = `${BASE}/watch/${id}.html`;
        html = await fetchHtml(watchUrl);
      }
    }

    const sources = parseSources(html);
    if (!sources.length) throw new Error('No sources found');

    const preferred = sources.find(s => s.quality === '720p') || sources[0];
    res.status(200).json({ src: preferred.url, quality: preferred.quality, all: sources });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
