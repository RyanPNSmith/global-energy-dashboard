import { createHash } from 'crypto';

/**
 * Proxies multi-country generation time series requests to the backend.
 */
export async function GET(request) {
    try {
      const { searchParams } = new URL(request.url);
      const countries = searchParams.get('countries');
      if (!countries) {
        return Response.json({ error: 'countries query parameter is required' }, { status: 400 });
      }
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
      const apiKey = process.env.BACKEND_API_KEY;
      if (!apiKey) {
        throw new Error('BACKEND_API_KEY environment variable is not set');
      }
  
      const params = new URLSearchParams();
      params.append('countries', countries);
  
      const response = await fetch(`${backendUrl}/api/generation?${params.toString()}`, {
        headers: { 'X-API-Key': apiKey },
        cache: 'no-store'
      });
  
      if (!response.ok) {
        throw new Error(`Backend responded with status: ${response.status}`);
      }
  
      const data = await response.json();
      const etag = createHash('sha1').update(JSON.stringify(data)).digest('hex');

      return Response.json(data, {
        headers: {
          'Cache-Control': 'no-store',
          'ETag': `"${etag}"`
        }
      });
    } catch (error) {
      console.error('Error fetching generation:', error);
      return Response.json({}, { status: 500 });
    }
  }