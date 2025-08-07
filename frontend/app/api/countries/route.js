export async function GET(request) {
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
      next: { revalidate: 600 },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();

    return Response.json(data.data || data, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=600',
        ETag: `"${Date.now()}"`,
      },
    });
  } catch (error) {
    console.error('Error fetching country list:', error);
    return Response.json([], { status: 500 });
  }
}
