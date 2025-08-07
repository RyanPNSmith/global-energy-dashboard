"use client"

import { useEffect, useState, useCallback } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Card } from './ui/card'
import { Badge } from './ui/badge'

// Define fuel type colors
const fuelColors = {
  'Coal': '#000000',
  'Gas': '#FFA500',
  'Oil': '#8B4513',
  'Hydro': '#1E90FF',
  'Nuclear': '#800080',
  'Wind': '#00BFFF',
  'Solar': '#FFD700',
  'Biomass': '#228B22',
  'Geothermal': '#FF4500',
  'Waste': '#A52A2A',
  'Other': '#808080'
}

// Legend component
const MapLegend = () => {
  return (
    <Card className="absolute bottom-5 right-5 z-[1000] p-3 bg-white bg-opacity-95 shadow-lg">
      <h4 className="text-sm font-medium mb-2">Fuel Types</h4>
      <div className="grid grid-cols-2 gap-1">
        {Object.entries(fuelColors).map(([fuel, color]) => (
          <div key={fuel} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
            <span className="text-xs">{fuel}</span>
          </div>
        ))}
      </div>
      <div className="mt-2">
        <p className="text-xs text-gray-500">Marker size indicates capacity (MW)</p>
      </div>
    </Card>
  )
}

// Simple marker rendering component
const PowerPlantMarkers = ({ plants, onCountrySelect }) => {
  const map = useMap()
  
  // Calculate marker size based on capacity
  const getMarkerRadius = useCallback((capacity) => {
    if (capacity < 100) return 3
    if (capacity < 500) return 4
    if (capacity < 1000) return 5
    if (capacity < 2000) return 6
    return 7
  }, [])
  
  // Get color based on fuel type
  const getMarkerColor = useCallback((fuel) => {
    return fuelColors[fuel] || fuelColors['Other']
  }, [])
  
  return (
    <>
      {plants.map((plant, index) => {
        // Validate coordinates before rendering
        const lat = parseFloat(plant.latitude)
        const lng = parseFloat(plant.longitude)
        
        // Skip plants with invalid coordinates
        if (isNaN(lat) || isNaN(lng) || lat === undefined || lng === undefined) {
          return null
        }
        
        return (
          <CircleMarker
            key={plant.gppd_idnr || plant.id || index}
            center={[lat, lng]}
            radius={getMarkerRadius(plant.capacity_mw)}
            fillColor={getMarkerColor(plant.primary_fuel)}
            color="#fff"
            weight={1}
            opacity={1}
            fillOpacity={0.8}
          >
            <Popup>
              <div className="text-sm">
                <h3 className="font-bold text-[#3d4a5d]">{plant.name}</h3>
                <p><strong>Country:</strong> {plant.country_long || plant.country}</p>
                <p><strong>Capacity:</strong> {plant.capacity_mw ? plant.capacity_mw.toLocaleString() : 'N/A'} MW</p>
                <p><strong>Fuel:</strong> {plant.primary_fuel || 'Unknown'}</p>
                {plant.commissioning_year && (
                  <p><strong>Commissioned:</strong> {plant.commissioning_year}</p>
                )}
                {plant.owner && (
                  <p><strong>Owner:</strong> {plant.owner}</p>
                )}
                <Badge 
                  className="mt-2 cursor-pointer bg-[#3d4a5d] hover:bg-[#4d5b70]" 
                  onClick={() => onCountrySelect && onCountrySelect([plant.country_long || plant.country])}
                >
                  View Country Data
                </Badge>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </>
  )
}

export default function PowerPlantMap({ onCountrySelect }) {
  const [powerPlants, setPowerPlants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hasLoaded, setHasLoaded] = useState(false)
  
  // Simple loading function
  const loadPowerPlants = useCallback(async () => {
    try {
      const response = await fetch('/api/power-plants?limit=5000', {
        headers: {
          'x-api-key': '4H2K8D7F5L9Q3X1A'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch power plant data: ${response.status}`)
      }
      
      const data = await response.json()
      const plants = data.data || data
      
      // Filter valid plants
      const validPlants = plants.filter(plant => 
        plant.latitude && 
        plant.longitude && 
        !isNaN(plant.latitude) && 
        !isNaN(plant.longitude) &&
        plant.capacity_mw > 0
      )
      
      return validPlants
    } catch (err) {
      throw err
    }
  }, [])
  
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
          setHasLoaded(true)
        } else {
          throw new Error('No power plants loaded')
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred')
          setPowerPlants(samplePowerPlants)
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
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3d4a5d]"></div>
        <p className="mt-2 text-sm text-gray-600">Loading power plant data...</p>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-red-500 mb-2">Error loading map: {error}</p>
        <p className="text-sm text-gray-600 mb-4">Displaying sample data instead</p>
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
        
        <PowerPlantMarkers 
          plants={powerPlants} 
          onCountrySelect={onCountrySelect} 
        />
        
        <MapLegend />
        
        {/* Data summary */}
        <div className="absolute top-5 left-5 z-[1000] bg-white bg-opacity-95 p-3 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-700">
            Showing {powerPlants.length.toLocaleString()} power plants
          </p>
        </div>
      </MapContainer>
    </div>
  )
}

// Sample data for demonstration
const samplePowerPlants = [
  {
    id: '1',
    name: 'Three Gorges Dam',
    country: 'China',
    capacity_mw: 22500,
    latitude: 30.8243,
    longitude: 111.0032,
    primary_fuel: 'Hydro',
    commissioning_year: 2012
  },
  {
    id: '2',
    name: 'Itaipu Dam',
    country: 'Brazil',
    capacity_mw: 14000,
    latitude: -25.4075,
    longitude: -54.5882,
    primary_fuel: 'Hydro',
    commissioning_year: 1984
  }
] 