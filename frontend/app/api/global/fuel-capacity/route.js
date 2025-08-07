import { createHash } from 'crypto';

export async function GET(request) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000'
    const apiKey = process.env.BACKEND_API_KEY
    if (!apiKey) {
      throw new Error('BACKEND_API_KEY environment variable is not set')
    }

    const response = await fetch(`${backendUrl}/api/global/fuel-capacity`, {
      headers: {
        'X-API-Key': apiKey
      }
    })

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`)
    }

    const data = await response.json()
    const etag = createHash('sha1').update(JSON.stringify(data)).digest('hex');

    return Response.json(data.data || data, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=600',
        'ETag': `"${etag}"`,
      }
    })
  } catch (error) {
    console.error('Error fetching global fuel capacity:', error)
    return Response.json([], { status: 500 })
  }
}
