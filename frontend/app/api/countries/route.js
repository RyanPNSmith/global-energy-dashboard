export async function GET(request) {
  /**
   * Fetches the list of countries (`country` and `country_long`) from backend.
   */
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const apiKey = process.env.BACKEND_API_KEY;

    if (!apiKey) {
      throw new Error('BACKEND_API_KEY environment variable is not set');
    }

    const backendEndpoint = new URL('/api/countries/summary', backendUrl);

    const response = await fetch(backendEndpoint.toString(), {
      headers: {
        'X-API-Key': apiKey,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();

    return Response.json(data.data || data, {
      headers: {
        'Cache-Control': 'no-store',
        ETag: `"${Date.now()}"`,
      },
    });
  } catch (error) {
    console.error('Error fetching country list:', error);
    return Response.json([], { status: 500 });
  }
}

export async function POST(request) {
  /**
   * Proxies country update payloads (capacity and generation overrides).
   */
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000'
    const apiKey = process.env.BACKEND_API_KEY
    if (!apiKey) {
      throw new Error('BACKEND_API_KEY environment variable is not set')
    }

    const body = await request.json()
    const response = await fetch(`${backendUrl}/api/countries/update-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    return Response.json(data, { status: response.status })
  } catch (error) {
    console.error('Error updating country data:', error)
    return Response.json({ error: 'Failed to update country data' }, { status: 500 })
  }
}