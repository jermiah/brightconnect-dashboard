export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Check both possible env var names
  const VAPI_KEY = process.env.VAPI_PRIVATE_KEY || process.env.VAPI_API_KEY

  if (!VAPI_KEY) {
    return res.status(500).json({
      error: 'API key not configured',
      debug: {
        hasPrivateKey: !!process.env.VAPI_PRIVATE_KEY,
        hasApiKey: !!process.env.VAPI_API_KEY
      }
    })
  }

  // Debug: show key format (masked)
  const keyLength = VAPI_KEY.length
  const keyPreview = VAPI_KEY.substring(0, 8) + '...' + VAPI_KEY.substring(VAPI_KEY.length - 4)

  try {
    const response = await fetch('https://api.vapi.ai/org', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VAPI_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      return res.status(500).json({
        error: 'VAPI API error',
        status: response.status,
        details: errorText,
        debug: {
          keyLength: keyLength,
          keyPreview: keyPreview
        }
      })
    }

    const orgData = await response.json()
    return res.status(200).json({
      success: true,
      credits: orgData.credits || 0,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch credits',
      message: error.message
    })
  }
}
