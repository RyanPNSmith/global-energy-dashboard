"use client"

import { Card } from '@/components/ui/card'
import { fuelColors } from '@/lib/map'

export default function MapLegend() {
  return (
    <Card className="absolute bottom-5 right-5 z-[1000] p-3 bg-white bg-opacity-95 shadow-lg">
      <h4 className="text-sm font-medium mb-2">Fuel Types</h4>
      <div className="grid grid-cols-2 gap-1">
        {Object.entries(fuelColors).map(([fuel, color]) => (
          <div key={fuel} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
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