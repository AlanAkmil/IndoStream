const BASE = 'https://www.dubbindo.site';

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  try {
    // Step 1: fetch embed page buat dapet session token
    const embedRes = await fetch(`${BASE}/embed/${id}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
        'Referer': `${BASE}/`,
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    const html = await embedRes.text();
    const cookies = embedRes.headers.get('set-cookie') || '';

    // Ambil session hash dari input.main_session
    const sessionMatch = html.match(/class="main_session"\s+value="([^"]+)"/);
    if (!sessionMatch) return res.status(404).json({ error: 'Session not found' });
    const session = sessionMatch[1];

    // Ambil video src langsung dari JS (ada di source code)
    const videoMatch = html.match(/\$'video'\)\.attr\('src',\s*'([^']+\.mp4[^']*)'\)/) ||
                       html.match(/'(https:\/\/s3\.dubbindo\.my\.id\/upload\/videos\/[^']+\.mp4[^']*)'/) ||
                       html.match(/src="(https:\/\/s3\.dubbindo\.my\.id\/upload\/videos\/[^"]+\.mp4[^"]*)"/) ||
                       html.match(/src:\s*'(https:\/\/[^']+\.mp4[^']*)'/);

    if (videoMatch) {
      return res.status(200).json({ 
        status: 200, 
        src: videoMatch[1],
        session 
      });
    }

    // Step 2: kalau gak ada di HTML, hit AJAX endpoint dengan fingerprint palsu
    const finger = Math.random().toString(36).substring(2, 34);
    const ajaxRes = await fetch(`${BASE}/aj/views?hash=${session}&type_=set`, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
        'Referer': `${BASE}/embed/${id}`,
        'Origin': BASE,
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
        'Cookie': cookies,
      },
      body: `finger=${finger}`,
    });

    const ajaxData = await ajaxRes.text();
    
    // Cari video URL dari response
    const srcMatch = ajaxData.match(/(https:\/\/[^\s"']+\.mp4[^\s"']*)/);
    if (srcMatch) {
      return res.status(200).json({ status: 200, src: srcMatch[1], session });
    }

    // Return raw untuk debug
    return res.status(200).json({ 
      status: 404, 
      error: 'Video source not found',
      session,
      ajax_response: ajaxData.slice(0, 500)
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
