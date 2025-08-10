import { createHash } from 'crypto'

/**
 * Returns country capacity details, honoring overrides when present.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const countryName = searchParams.get('countryName')
    if (!countryName) {
      return Response.json({ error: 'countryName query parameter is required' }, { status: 400 })
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000'
    const apiKey = process.env.BACKEND_API_KEY
    if (!apiKey) {
      throw new Error('BACKEND_API_KEY environment variable is not set')
    }

    const response = await fetch(`${backendUrl}/api/countries/details?countryName=${encodeURIComponent(countryName)}`, {
      headers: { 'X-API-Key': apiKey },
      cache: 'no-store'
    })
    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`)
    }

    const data = await response.json()
    const etag = createHash('sha1').update(JSON.stringify(data)).digest('hex')
    return Response.json(data.data || data, {
      headers: {
        'Cache-Control': 'no-store',
        'ETag': `"${etag}"`,
      }
    })
  } catch (error) {
    console.error('Error fetching country details:', error)
    return Response.json({ error: 'Failed to fetch country details' }, { status: 500 })
  }
}


