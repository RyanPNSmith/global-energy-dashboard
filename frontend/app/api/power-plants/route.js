export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const country = searchParams.get('country')
    const fuel = searchParams.get('fuel')
    const limit = searchParams.get('limit') || '5000'
    const offset = searchParams.get('offset') || '0'

    // Build query string
    const queryParams = new URLSearchParams()
    if (country) queryParams.append('country', country)
    if (fuel) queryParams.append('fuel', fuel)
    queryParams.append('limit', limit)
    queryParams.append('offset', offset)

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000'
    const response = await fetch(`${backendUrl}/api/power-plants?${queryParams}`, {
      headers: {
        'X-API-Key': process.env.BACKEND_API_KEY || '4H2K8D7F5L9Q3X1A'
      }
    })

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`)
    }

    const data = await response.json()
    
    // Return the data directly
    return Response.json(data.data || data)

  } catch (error) {
    console.error('Error fetching power plants:', error)
    
    // Return sample data as fallback
    return Response.json([
      {
        gppd_idnr: '1',
        name: 'Three Gorges Dam',
        country: 'China',
        country_long: 'China',
        capacity_mw: 22500,
        latitude: 30.8243,
        longitude: 111.0032,
        primary_fuel: 'Hydro',
        commissioning_year: 2012,
        owner: 'China Three Gorges Corporation'
      },
      {
        gppd_idnr: '2',
        name: 'Itaipu Dam',
        country: 'Brazil',
        country_long: 'Brazil',
        capacity_mw: 14000,
        latitude: -25.4075,
        longitude: -54.5882,
        primary_fuel: 'Hydro',
        commissioning_year: 1984,
        owner: 'Itaipu Binacional'
      }
    ])
  }
} 