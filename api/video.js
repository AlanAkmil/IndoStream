export default async function handler(req, res) {
  const { url } = req.query;
  if (!url || !url.startsWith('https://s3.dubbindo.my.id/upload/videos/')) {
    return res.status(403).send('Forbidden');
  }

  // Redirect langsung ke video URL
  // Browser akan ikut redirect dan bisa stream langsung
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.redirect(302, url);
}
