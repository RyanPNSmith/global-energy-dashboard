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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [mapBounds, setMapBounds] = useState(null)
  const [viewportPlants, setViewportPlants] = useState([])

  const loadPowerPlants = useCallback(async (bounds = null) => {
    const params = new URLSearchParams()
    params.append('limit', '2000') // Reduced from 5000
    
    if (bounds) {
      params.append('bounds', `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`)
    }
    
    const response = await fetch(`/api/power-plants?${params}`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch power plant data: ${response.status}`)
    }
    
    const data = await response.json()
    const plants = data.data || data
    
    return plants.filter(plant =>
      plant.latitude &&
      plant.longitude &&
      !isNaN(plant.latitude) &&
      !isNaN(plant.longitude) &&
      plant.capacity_mw > 0
    )
  }, [])
  
  // Filter plants based on viewport
  const filteredPlants = useMemo(() => {
    if (!mapBounds || viewportPlants.length === 0) return []
    
    return viewportPlants.filter(plant => {
      const lat = parseFloat(plant.latitude)
      const lng = parseFloat(plant.longitude)
      
      return lat >= mapBounds.getSouth() &&
             lat <= mapBounds.getNorth() &&
             lng >= mapBounds.getWest() &&
             lng <= mapBounds.getEast()
    }).slice(0, 2000) // Limit to 2000 markers for performance
  }, [mapBounds, viewportPlants])
  
  useEffect(() => {
    if (hasLoaded) return
    
    let isMounted = true
    
    const fetchPowerPlants = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const plants = await loadPowerPlants()
        
        if (!isMounted) return
        
        if (plants && plants.length > 0) {
          setPowerPlants(plants)
          setViewportPlants(plants)
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
        const newPlants = await loadPowerPlants(bounds)
        setViewportPlants(newPlants)
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
            Showing {filteredPlants.length.toLocaleString()} of {powerPlants.length.toLocaleString()} power plants
          </p>
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