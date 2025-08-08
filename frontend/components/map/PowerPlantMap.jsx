"use client"

import { useEffect, useState, useCallback, useMemo } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import PowerPlantMarkers from './PowerPlantMarkers'
import MapLegend from './MapLegend'

// Component to handle map bounds changes
function MapBoundsHandler({ onBoundsChange }) {
  const map = useMap()
  
  useEffect(() => {
    const handleMoveEnd = () => {
      const bounds = map.getBounds()
      onBoundsChange(bounds)
    }
    
    map.on('moveend', handleMoveEnd)
    map.on('zoomend', handleMoveEnd)
    
    // Initial bounds
    handleMoveEnd()
    
    return () => {
      map.off('moveend', handleMoveEnd)
      map.off('zoomend', handleMoveEnd)
    }
  }, [map, onBoundsChange])
  
  return null
}

export default function PowerPlantMap({ onCountrySelect }) {
  const [powerPlants, setPowerPlants] = useState([])
  const [totalCount, setTotalCount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [mapBounds, setMapBounds] = useState(null)
  const [viewportPlants, setViewportPlants] = useState([])
  const MAX_RENDER = 3000

  const loadPowerPlants = useCallback(async (bounds = null) => {
    const PAGE_LIMIT = 2000
    const makeParams = (offset = 0) => {
      const p = new URLSearchParams()
      p.append('limit', String(PAGE_LIMIT))
      p.append('offset', String(offset))
      if (bounds) {
        p.append('bounds', `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`)
      }
      return p
    }

    const fetchPage = async (offset = 0) => {
      const response = await fetch(`/api/power-plants?${makeParams(offset)}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch power plant data: ${response.status}`)
      }
      return response.json()
    }

    // First page
    const firstPayload = await fetchPage(0)
    const firstPlants = (firstPayload.data || firstPayload || []).filter(plant =>
      plant.latitude &&
      plant.longitude &&
      !isNaN(plant.latitude) &&
      !isNaN(plant.longitude) &&
      plant.capacity_mw > 0
    )

    // If the server reports a higher total, page the rest to fetch all results
    const total = typeof firstPayload.total === 'number' ? firstPayload.total : firstPlants.length
    const shouldPaginate = total > firstPlants.length
    if (!shouldPaginate) {
      return { plants: firstPlants, total }
    }

    const allPlants = [...firstPlants]
    const seen = new Set(allPlants.map(p => p.gppd_idnr || p.id))
    const MAX_TO_FETCH = total // fetch all available

    for (let offset = PAGE_LIMIT; offset < MAX_TO_FETCH; offset += PAGE_LIMIT) {
      const payload = await fetchPage(offset)
      const pagePlants = (payload.data || payload || []).filter(plant =>
        plant.latitude &&
        plant.longitude &&
        !isNaN(plant.latitude) &&
        !isNaN(plant.longitude) &&
        plant.capacity_mw > 0
      )
      for (const plant of pagePlants) {
        const key = plant.gppd_idnr || plant.id
        if (!key || !seen.has(key)) {
          allPlants.push(plant)
          if (key) seen.add(key)
        }
      }

      // Stop early if we fetched fewer than a full page
      if (!payload || (payload.count && payload.count < PAGE_LIMIT) || pagePlants.length < PAGE_LIMIT) {
        break
      }
    }

    return { plants: allPlants, total }
  }, [])
  
  // Filter plants based on viewport
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

    // Limit markers rendered for performance
    return withinBounds.slice(0, MAX_RENDER)
  }, [mapBounds, viewportPlants])
  
  useEffect(() => {
    if (hasLoaded) return
    
    let isMounted = true
    
    const fetchPowerPlants = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const { plants, total } = await loadPowerPlants()
        
        if (!isMounted) return
        
        if (plants && plants.length > 0) {
          setPowerPlants(plants)
          setViewportPlants(plants)
          setTotalCount(total ?? plants.length)
          setHasLoaded(true)
        } else {
          throw new Error('No power plants loaded')
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred')
          setHasLoaded(true)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    fetchPowerPlants()
    
    return () => {
      isMounted = false
    }
  }, [hasLoaded, loadPowerPlants])
  
  const handleBoundsChange = useCallback(async (bounds) => {
    setMapBounds(bounds)
    
    // Only fetch new data if we have a significant viewport change
    if (bounds && powerPlants.length > 0) {
      try {
        const { plants: newPlants, total } = await loadPowerPlants(bounds)
        setViewportPlants(newPlants)
        if (typeof total === 'number') setTotalCount(total)
      } catch (error) {
        console.warn('Failed to load viewport data:', error)
      }
    }
  }, [loadPowerPlants, powerPlants.length])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3d4a5d]"></div>
        <p className="mt-2 text-sm text-gray-600">Loading power plant data...</p>
        <div className="mt-4 w-64 bg-gray-200 rounded-full h-2">
          <div className="bg-[#3d4a5d] h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
        </div>
        <p className="mt-2 text-xs text-gray-500">Optimizing for performance...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-red-500 mb-2">Error loading map: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-[#3d4a5d] text-white rounded-lg hover:bg-[#4d5b70] transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

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
          onCountrySelect={onCountrySelect} 
        />
        
        <MapLegend />
        
        {/* Data summary */}
        <div className="absolute top-5 left-5 z-[1000] bg-white bg-opacity-95 p-3 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-700">
            Showing {filteredPlants.length.toLocaleString()} of {(totalCount ?? powerPlants.length).toLocaleString()} power plants
          </p>
          {mapBounds && ((totalCount ?? viewportPlants.length) > filteredPlants.length) && (
            <p className="text-xs text-amber-600 mt-1">
              Viewport contains {(totalCount ?? viewportPlants.length).toLocaleString()} plants, displaying first {filteredPlants.length.toLocaleString()} for performance
            </p>
          )}
          {mapBounds && (
            <p className="text-xs text-gray-500 mt-1">
              Viewport: {mapBounds.getSouth().toFixed(2)}, {mapBounds.getWest().toFixed(2)} to {mapBounds.getNorth().toFixed(2)}, {mapBounds.getEast().toFixed(2)}
            </p>
          )}
        </div>
      </MapContainer>
    </div>
  )
}