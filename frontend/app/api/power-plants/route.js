import { createHash } from 'crypto';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const country = searchParams.get('country')
    const fuel = searchParams.get('fuel')
    const limit = searchParams.get('limit') || '2000'
    const offset = searchParams.get('offset') || '0'
    const bounds = searchParams.get('bounds')

    // Build query string
    const queryParams = new URLSearchParams()
    if (country) queryParams.append('country', country)
    if (fuel) queryParams.append('fuel', fuel)
    queryParams.append('limit', limit)
    queryParams.append('offset', offset)
    if (bounds) queryParams.append('bounds', bounds)

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000'
    const apiKey = process.env.BACKEND_API_KEY
    if (!apiKey) {
      throw new Error('BACKEND_API_KEY environment variable is not set')
    }

    const response = await fetch(`${backendUrl}/api/power-plants?${queryParams}`, {
      headers: {
        'X-API-Key': apiKey
      }
    })

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`)
    }

    const data = await response.json()
    const etag = createHash('sha1').update(JSON.stringify(data)).digest('hex');
    

    // Return the FULL backend payload so frontend can access metadata like total/count
    return Response.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=600', // Cache for 5 minutes client, 10 minutes CDN
        'ETag': `"${etag}"`, // Simple ETag for caching
      }
    })

  } catch (error) {
    console.error('Error fetching power plants:', error)
    
    return Response.json({ error: 'Failed to fetch power plants' }, { status: 500 });
  }
} 