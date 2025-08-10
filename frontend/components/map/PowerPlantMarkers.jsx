"use client"

import { useMemo } from 'react'
import { CircleMarker, Popup } from 'react-leaflet'
import { Badge } from '@/components/ui/badge'
import { getFuelColor, getMarkerRadius } from '@/lib/map'

/**
 * Grid-based clustering in O(n). Bins points into a fixed-size grid and groups by cell.
 *
 * @param {Array<object>} plants - Flat list of power plant objects containing numeric `latitude` and `longitude`.
 * @param {number} [cellSizeDeg=0.3] - Grid cell size in degrees used for binning markers.
 * @returns {Array<Array<object>>} Array of clusters, where each cluster is an array of plants.
 */
function gridClusterMarkers(plants, cellSizeDeg = 0.3) {
  const cellKey = (lat, lng) => `${Math.floor(lat / cellSizeDeg)},${Math.floor(lng / cellSizeDeg)}`
  const grid = new Map()
  for (const plant of plants) {
    const lat = parseFloat(plant.latitude)
    const lng = parseFloat(plant.longitude)
    if (Number.isNaN(lat) || Number.isNaN(lng)) continue
    const key = cellKey(lat, lng)
    if (!grid.has(key)) grid.set(key, [])
    grid.get(key).push(plant)
  }
  return Array.from(grid.values())
}

export default function PowerPlantMarkers({ plants, onCountrySelect }) {
  /**
   * Renders power plant markers or cluster markers based on input size.
   *
   * @param {{
   *   plants: Array<object>,
   *   onCountrySelect?: (countries: string[], opts?: { source?: string }) => void
   * }} props
   */
  // Render clusters or individual markers; heavy work is memoized in parent
  const clusteredPlants = useMemo(() => {
    if (plants.length <= 1000) {
      return plants.map(plant => [plant])
    }
    return gridClusterMarkers(plants, 0.3)
  }, [plants])

  return (
    <>
      {clusteredPlants.map((cluster, clusterIndex) => {
        if (cluster.length === 1) {
          const plant = cluster[0]
          const lat = parseFloat(plant.latitude)
          const lng = parseFloat(plant.longitude)

          if (isNaN(lat) || isNaN(lng)) {
            return null
          }

          return (
            <CircleMarker
              key={plant.gppd_idnr || plant.id || clusterIndex}
              center={[lat, lng]}
              radius={getMarkerRadius(plant.capacity_mw)}
              fillColor={getFuelColor(plant.primary_fuel)}
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
                    onClick={() => onCountrySelect && onCountrySelect([plant.country_long || plant.country], { source: 'map' })}
                  >
                    View Country Data
                  </Badge>
                </div>
              </Popup>
            </CircleMarker>
          )
        } else {
          const centerLat = cluster.reduce((sum, plant) => sum + parseFloat(plant.latitude), 0) / cluster.length
          const centerLng = cluster.reduce((sum, plant) => sum + parseFloat(plant.longitude), 0) / cluster.length
          const totalCapacity = cluster.reduce((sum, plant) => sum + (plant.capacity_mw || 0), 0)
          const fuelTypes = [...new Set(cluster.map(plant => plant.primary_fuel).filter(Boolean))]

          return (
            <CircleMarker
              key={`cluster-${clusterIndex}`}
              center={[centerLat, centerLng]}
              radius={Math.min(20, Math.max(8, cluster.length * 2))}
              fillColor="#3d4a5d"
              color="#fff"
              weight={2}
              opacity={1}
              fillOpacity={0.9}
            >
              <Popup>
                <div className="text-sm">
                  <h3 className="font-bold text-[#3d4a5d]">Power Plant Cluster</h3>
                  <p><strong>Count:</strong> {cluster.length} plants</p>
                  <p><strong>Total Capacity:</strong> {totalCapacity.toLocaleString()} MW</p>
                  <p><strong>Fuel Types:</strong> {fuelTypes.join(', ')}</p>
                  <div className="mt-2">
                    <p className="text-xs text-gray-600">Plants in this cluster:</p>
                    <div className="max-h-32 overflow-y-auto">
                      {cluster.slice(0, 10).map((plant, index) => (
                        <div key={index} className="text-xs py-1 border-b border-gray-100">
                          <strong>{plant.name}</strong> - {plant.capacity_mw?.toLocaleString()} MW ({plant.primary_fuel})
                        </div>
                      ))}
                      {cluster.length > 10 && (
                        <div className="text-xs text-gray-500 py-1">
                          ... and {cluster.length - 10} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          )
        }
      })}
    </>
  )
}