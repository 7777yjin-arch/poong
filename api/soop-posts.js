export default async function handler(req, res) {
  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'id required' })

  try {
    const response = await fetch(
      `https://api-channel.sooplive.co.kr/v1.1/channel/${id}/home/section/post`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Referer': 'https://www.sooplive.co.kr/',
        },
      }
    )
    const data = await response.json()
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 's-maxage=60')
    res.status(200).json(data)
  } catch (e) {
    res.status(500).json({ error: 'fetch failed' })
  }
}
