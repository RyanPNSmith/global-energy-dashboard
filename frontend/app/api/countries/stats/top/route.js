import { createHash } from 'crypto';

/**
 * Fetches top countries ranked by total capacity from backend.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') || '25'

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000'
    const apiKey = process.env.BACKEND_API_KEY
    if (!apiKey) {
      throw new Error('BACKEND_API_KEY environment variable is not set')
    }

    const response = await fetch(`${backendUrl}/api/countries/stats/top?limit=${limit}`, {
      headers: {
        'X-API-Key': apiKey
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`)
    }

    const data = await response.json()
    const etag = createHash('sha1').update(JSON.stringify(data)).digest('hex');

    return Response.json(data.data || data, {
      headers: {
        'Cache-Control': 'no-store',
        'ETag': `"${etag}"`,
      }
    })
  } catch (error) {
    console.error('Error fetching top countries:', error)
    return Response.json([], { status: 500 })
  }
} 