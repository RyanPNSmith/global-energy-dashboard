import { createHash } from 'crypto'

export async function GET(request, { params }) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000'
    const apiKey = process.env.BACKEND_API_KEY
    if (!apiKey) {
      throw new Error('BACKEND_API_KEY environment variable is not set')
    }

    const country = decodeURIComponent(params.country)
    const response = await fetch(`${backendUrl}/api/countries/${encodeURIComponent(country)}/fuels`, {
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
    console.error('Error fetching country fuel breakdown:', error)
    return Response.json({ error: 'Failed to fetch country fuel breakdown' }, { status: 500 })
  }
}


