export const fuelColors = {
    Coal: '#000000',
    Gas: '#FFA500',
    Oil: '#8B4513',
    Hydro: '#1E90FF',
    Nuclear: '#800080',
    Wind: '#00BFFF',
    Solar: '#FFD700',
    Biomass: '#228B22',
    Geothermal: '#FF4500',
    Waste: '#A52A2A',
    Other: '#808080'
  }
  
  export function getFuelColor(fuel) {
    return fuelColors[fuel] || fuelColors.Other
  }
  
  export function getMarkerRadius(capacity) {
    const cap = Number(capacity)
    if (isNaN(cap) || cap <= 0) return 3
    if (cap < 100) return 3
    if (cap < 500) return 4
    if (cap < 1000) return 5
    if (cap < 2000) return 6
    return 7
  }