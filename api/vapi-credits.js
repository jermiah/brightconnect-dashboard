export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Use non-VITE prefixed env var for serverless functions
  const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY

  if (!VAPI_PRIVATE_KEY) {
    return res.status(500).json({ error: 'API key not configured' })
  }

  try {
    const response = await fetch('https://api.vapi.ai/account', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`VAPI API error: ${response.status}`)
    }

    const data = await response.json()
    return res.status(200).json({
      credits: data.remainingBalance || data.balance || 0
    })
  } catch (error) {
    console.error('Error fetching VAPI credits:', error)
    return res.status(500).json({ error: 'Failed to fetch credits' })
  }
}
