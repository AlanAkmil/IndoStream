const BASE = 'https://www.dubbindo.site';

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ status: 400, error: 'ID required' });

  try {
    // id bisa berupa full slug (love-100-c-2010_7cYjL6VhWiZT4C6.html) atau cuma shortcode (7cYjL6VhWiZT4C6)
    let watchPath = id;
    if (!id.includes('_') && !id.endsWith('.html')) {
      // shortcode only - coba embed page dulu
      const embedUrl = `${BASE}/embed/${id}`;
      const embedRes = await fetch(embedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': BASE,
        },
      });
      if (embedRes.ok) {
        const embedHtml = await embedRes.text();
        const sources = parseSourceTags(embedHtml);
        if (sources.length > 0) {
          const titleMatch = embedHtml.match(/<title>([^<]+)<\/title>/);
          const title = titleMatch ? titleMatch[1].replace(/\s*\|.*$/, '').trim() : '';
          return res.status(200).json({ status: 200, id, title, sources });
        }
      }
    }

    // Fetch watch page
    const url = id.endsWith('.html')
      ? `${BASE}/watch/${id}`
      : `${BASE}/watch/${id}`;

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

    // Parse <source> tags dengan data-quality / label / res
    const sources = parseSourceTags(html);

    if (sources.length > 0) {
      return res.status(200).json({ status: 200, id, title, sources });
    }

    // Fallback: cari di updateSrc JS
    const updateSrcRegex = /src:\s*'(https?:\/\/[^']+\.mp4[^']*)'.+?label:\s*'([^']+)'/gs;
    let m;
    const seenUrls = new Set();
    while ((m = updateSrcRegex.exec(html)) !== null) {
      const url2 = m[1];
      if (!seenUrls.has(url2)) {
        seenUrls.add(url2);
        sources.push({ quality: m[2], url: url2 });
      }
    }

    res.status(200).json({ status: 200, id, title, sources });
  } catch (err) {
    res.status(500).json({ status: 500, error: err.message, sources: [] });
  }
}

function parseSourceTags(html) {
  const sources = [];
  const seenUrls = new Set();
  // Match: <source src="...mp4" ... data-quality="720p" ... label="720p" ... res="720">
  const sourceRegex = /<source\s+[^>]*src="(https?:\/\/[^"]+\.mp4[^"]*)"[^>]*>/gi;
  let m;
  while ((m = sourceRegex.exec(html)) !== null) {
    const srcUrl = m[1];
    if (seenUrls.has(srcUrl)) continue;
    seenUrls.add(srcUrl);

    const tag = m[0];
    const labelMatch = tag.match(/label='([^']+)'/) || tag.match(/label="([^"]+)"/) || tag.match(/data-quality="([^"]+)"/);
    const quality = labelMatch ? labelMatch[1] : `${sources.length + 1}`;

    sources.push({ quality, url: srcUrl });
  }
  return sources;
}
