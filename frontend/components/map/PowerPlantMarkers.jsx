"use client"

import { useMemo } from 'react'
import { CircleMarker, Popup } from 'react-leaflet'
import { Badge } from '@/components/ui/badge'
import { getFuelColor, getMarkerRadius } from '@/lib/map'

/**
 * Groups nearby plants into clusters using a simple distance threshold on lat/lng.
 * This trades accuracy for speed and avoids bringing in a clustering library.
 *
 * @param {Array<Record<string, any>>} plants - Flat list of power plants
 * @param {number} [maxDistance=0.5] - Distance threshold in degrees for clustering
 * @returns {Array<Array<Record<string, any>>>} Array of clusters (each cluster is a list of plants)
 */
function clusterMarkers(plants, maxDistance = 0.5) {
  const clusters = []
  const used = new Set()

  for (let i = 0; i < plants.length; i++) {
    if (used.has(i)) continue

    const cluster = [plants[i]]
    used.add(i)

    for (let j = i + 1; j < plants.length; j++) {
      if (used.has(j)) continue

      const plant1 = plants[i]
      const plant2 = plants[j]

      const lat1 = parseFloat(plant1.latitude)
      const lng1 = parseFloat(plant1.longitude)
      const lat2 = parseFloat(plant2.latitude)
      const lng2 = parseFloat(plant2.longitude)

      const distance = Math.sqrt(
        Math.pow(lat1 - lat2, 2) + Math.pow(lng1 - lng2, 2)
      )

      if (distance < maxDistance) {
        cluster.push(plant2)
        used.add(j)
      }
    }

    clusters.push(cluster)
  }

  return clusters
}

export default function PowerPlantMarkers({ plants, onCountrySelect }) {
  // Render clusters or individual markers; heavy work is memoized in parent
  const clusteredPlants = useMemo(() => {
    if (plants.length <= 1000) {
      return plants.map(plant => [plant])
    }

    return clusterMarkers(plants, 0.3)
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