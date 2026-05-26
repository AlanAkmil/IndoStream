const BASE = 'https://www.dubbindo.site';

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ status: 400, error: 'ID required' });

  try {
    const url = `${BASE}/watch/${id}`;
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

    // Title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch ? titleMatch[1].replace(' | UVideo', '').trim() : id;

    // Thumbnail
    const thumbMatch = html.match(/property="og:image"\s+content="([^"]+)"/);
    const thumb = thumbMatch ? thumbMatch[1] : '';

    // Description
    const descMatch = html.match(/property="og:description"\s+content="([^"]+)"/);
    const description = descMatch ? descMatch[1] : '';

    // Views
    const viewsMatch = html.match(/(\d[\d.,]*)\s*Views?/i);
    const views = viewsMatch ? viewsMatch[1] : '0';

    // Channel/uploader
    const channelMatch = html.match(/class="video-owner"[^>]*>[\s\S]*?href="[^"]*@([^"]+)"[^>]*>([^<]+)<\/a>/);
    const channel = channelMatch ? channelMatch[2].trim() : '';

    // Related videos
    const related = [];
    const relatedRegex = /href="(https?:\/\/www\.dubbindo\.site\/watch\/([^"]+)_([a-zA-Z0-9]+)\.html)"/g;
    const seenIds = new Set([id.split('_').pop()?.replace('.html', '')]);
    let match;
    while ((match = relatedRegex.exec(html)) !== null) {
      const videoId = match[3];
      if (seenIds.has(videoId)) continue;
      seenIds.add(videoId);
      const start = Math.max(0, match.index - 500);
      const ctx = html.slice(start, match.index + match[1].length + 200);
      const relThumb = ctx.match(/src="(https:\/\/s3\.dubbindo\.my\.id\/upload\/photos\/[^"]+)"/)?.[1] || '';
      const relTitle = ctx.match(/title="([^"]{3,150})"/)?.[1] || match[2].replace(/-/g, ' ');
      related.push({ id: videoId, title: relTitle, thumb: relThumb, url: match[1] });
      if (related.length >= 12) break;
    }

    res.status(200).json({ status: 200, id, title, thumb, description, views, channel, related });
  } catch (err) {
    res.status(500).json({ status: 500, error: err.message });
  }
}