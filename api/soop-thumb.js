export default async function handler(req, res) {
  const { bno } = req.query
  if (!bno) return res.status(400).json({ error: 'bno required' })

  try {
    const response = await fetch(`https://liveimg.sooplive.co.kr/m/${bno}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    const buffer = await response.arrayBuffer()
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Cache-Control', 's-maxage=10')
    res.status(200).send(Buffer.from(buffer))
  } catch (e) {
    res.status(500).json({ error: 'fetch failed' })
  }
}
