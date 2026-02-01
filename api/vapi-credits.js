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

  // Try multiple possible endpoints
  const endpoints = [
    'https://api.vapi.ai/org',
    'https://api.vapi.ai/organization',
    'https://api.vapi.ai/me',
    'https://api.vapi.ai/billing'
  ]

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        return res.status(200).json({
          credits: data.remainingBalance || data.balance || data.credits || 0,
          endpoint: endpoint,
          raw: data
        })
      }
    } catch (e) {
      // Try next endpoint
    }
  }

  // If none worked, return error with attempted endpoints
  return res.status(500).json({
    error: 'No working VAPI endpoint found',
    triedEndpoints: endpoints,
    hint: 'VAPI may not expose account balance via API'
  })
}
