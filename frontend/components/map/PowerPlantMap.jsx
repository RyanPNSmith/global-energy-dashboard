"use client"

import { useEffect, useState, useCallback, useMemo } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import PowerPlantMarkers from './PowerPlantMarkers'
import MapLegend from './MapLegend'

/**
 * Subscribes to Leaflet map move/zoom events and notifies parent about new bounds.
 *
 * @param {{ onBoundsChange: (bounds: import('leaflet').LatLngBounds) => void }} props
 */
function MapBoundsHandler({ onBoundsChange }) {
  const map = useMap()
  
  useEffect(() => {
    const handleMoveEnd = () => {
      const bounds = map.getBounds()
      onBoundsChange(bounds)
    }
    
    map.on('moveend', handleMoveEnd)
    map.on('zoomend', handleMoveEnd)
    
    handleMoveEnd()
    
    return () => {
      map.off('moveend', handleMoveEnd)
      map.off('zoomend', handleMoveEnd)
    }
  }, [map, onBoundsChange])
  
  return null
}

/**
 * Interactive Leaflet map for displaying power plants.
 * Fetches data for the current viewport and renders markers/clusters.
 *
 * @param {{ onCountrySelect?: (countries: string[], opts?: { source?: string }) => void }} props
 */
export default function PowerPlantMap({ onCountrySelect }) {
  const [totalCount, setTotalCount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mapBounds, setMapBounds] = useState(null)
  const [viewportPlants, setViewportPlants] = useState([])
  const MAX_RENDER = 3000

  /**
   * Load power plant data for the given viewport bounds from the API.
   *
   * @param {import('leaflet').LatLngBounds} bounds
   * @returns {Promise<{ plants: Array<object>, total: number }>} payload
   */
  const loadPowerPlants = useCallback(async (bounds) => {
    const PAGE_LIMIT = 2000
    const params = new URLSearchParams()
    params.append('limit', String(PAGE_LIMIT))
    params.append('offset', '0')
    if (bounds) {
      params.append('bounds', `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`)
    }

    const response = await fetch(`/api/power-plants?${params.toString()}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch power plant data: ${response.status}`)
    }
    const payload = await response.json()
    const plants = (payload.data || payload || []).filter(plant =>
      plant.latitude &&
      plant.longitude &&
      !isNaN(plant.latitude) &&
      !isNaN(plant.longitude) &&
      plant.capacity_mw > 0
    )
    const total = typeof payload.total === 'number' ? payload.total : plants.length
    return { plants, total }
  }, [])
  
  const filteredPlants = useMemo(() => {
    if (!mapBounds || viewportPlants.length === 0) return []

    const withinBounds = viewportPlants.filter(plant => {
      const lat = parseFloat(plant.latitude)
      const lng = parseFloat(plant.longitude)

      return lat >= mapBounds.getSouth() &&
             lat <= mapBounds.getNorth() &&
             lng >= mapBounds.getWest() &&
             lng <= mapBounds.getEast()
    })

    return withinBounds.slice(0, MAX_RENDER)
  }, [mapBounds, viewportPlants])
  
  // Initial loading is handled when first bounds arrive
  useEffect(() => {
    if (!mapBounds) return
    let isMounted = true
    setLoading(true)
    setError(null)
    loadPowerPlants(mapBounds)
      .then(({ plants, total }) => {
        if (!isMounted) return
        setViewportPlants(plants)
        if (typeof total === 'number') setTotalCount(total)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'An unknown error occurred'))
      .finally(() => setLoading(false))
    return () => { isMounted = false }
  }, [mapBounds, loadPowerPlants])
  
  const handleBoundsChange = useCallback(async (bounds) => {
    setMapBounds(bounds)
  }, [])

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={[20, 0]}
        zoom={4}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        minZoom={2}
        maxZoom={18}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapBoundsHandler onBoundsChange={handleBoundsChange} />
        
        <PowerPlantMarkers
          plants={filteredPlants}
          onCountrySelect={(countries, { source } = {}) => {
            if (Array.isArray(countries) && countries.length > 0) {
              onCountrySelect?.(countries)
              window.dispatchEvent(new CustomEvent('country-selected', { detail: { countries, source: source || 'map' } }))
            }
          }}
        />
        
        <MapLegend />
      </MapContainer>

      {(loading || error) && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 pointer-events-none">
          {loading && (
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3d4a5d]"></div>
              <p className="mt-2 text-sm text-gray-600">Loading power plant data...</p>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center">
              <p className="text-red-500 mb-2">Error loading map: {error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}