export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY

  if (!VAPI_PRIVATE_KEY) {
    return res.status(500).json({ error: 'API key not configured' })
  }

  try {
    const response = await fetch('https://api.vapi.ai/org', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      return res.status(500).json({
        error: 'VAPI API error',
        status: response.status,
        details: errorText
      })
    }

    const orgData = await response.json()
    return res.status(200).json({
      credits: orgData.credits || 0
    })
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch credits',
      message: error.message
    })
  }
}
