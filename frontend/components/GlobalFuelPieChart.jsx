"use client"

import { useState, useEffect } from 'react'
import { fuelColors as sharedFuelColors } from '@/lib/map'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Pie } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

const sliceLabelPlugin = {
  id: 'sliceLabel',
  afterDatasetsDraw(chart) {
    const { ctx } = chart
    const dataset = chart.data.datasets[0]
    const meta = chart.getDatasetMeta(0)
    const total = dataset.data.reduce((sum, val) => sum + val, 0)

    meta.data.forEach((arc, i) => {
      const value = dataset.data[i]
      const percent = total ? value / total : 0
      if (percent <= 0.05) return
      const { x, y } = arc.tooltipPosition()
      ctx.save()
      ctx.fillStyle = '#fff'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${(percent * 100).toFixed(0)}%`, x, y)
      ctx.restore()
    })
  }
}

ChartJS.register(sliceLabelPlugin)

const fuelColors = sharedFuelColors

const MAJOR_FUELS = [
  'Coal',
  'Gas',
  'Oil',
  'Hydro',
  'Nuclear',
  'Wind',
  'Solar',
  'Biomass',
  'Geothermal',
  'Waste'
]

export default function GlobalFuelPieChart({ selectedCountries = [] }) {
  const [fuelData, setFuelData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        let res
        if (Array.isArray(selectedCountries) && selectedCountries.length === 1) {
          const listRes = await fetch('/api/countries', { cache: 'no-store' })
          if (!listRes.ok) throw new Error('Failed to load country list')
          const listJson = await listRes.json()
          const list = listJson.data || listJson
          const match = Array.isArray(list) ? list.find(c => (c.country_long || c.country) === selectedCountries[0]) : null
          const code = match?.country || null
          if (!code) throw new Error('Country code not found')
          res = await fetch(`/api/countries/${encodeURIComponent(code)}/fuels`, { cache: 'no-store' })
        } else {
          res = await fetch('/api/global/fuel-capacity')
        }
        if (!res.ok) {
          throw new Error('Failed to fetch fuel capacity data')
        }
        const json = await res.json()
        let data = json.data || json
        if (Array.isArray(data) && data.length > 0 && data[0].primary_fuel) {
          data = data.map(d => ({ fuel: d.primary_fuel, capacity_mw: Number(d.total_capacity || d.capacity_mw || 0) }))
        }
        const grouped = data.reduce((acc, raw) => {
          const rawFuel = raw.fuel || raw.primary_fuel
          const normalizedFuel = MAJOR_FUELS.includes(rawFuel) ? rawFuel : 'Other'
          const capacity = Number(raw.capacity_mw) || 0
          acc[normalizedFuel] = (acc[normalizedFuel] || 0) + capacity
          return acc
        }, {})

        const aggregated = Object.entries(grouped)
          .map(([fuel, capacity_mw]) => ({ fuel, capacity_mw }))
          .filter(item => item.capacity_mw > 0)
          .sort((a, b) => b.capacity_mw - a.capacity_mw)

        setFuelData(aggregated)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedCountries])

  if (loading) {
    return <div className="flex items-center justify-center h-[300px]">Loading fuel data...</div>
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px]">
        <p className="text-red-500 mb-2">Error: {error}</p>
      </div>
    )
  }

  if (!fuelData || fuelData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-sm text-gray-600">
        No fuel capacity data available.
      </div>
    )
  }

  const chartData = {
    labels: fuelData.map(d => d.fuel),
    datasets: [
      {
        data: fuelData.map(d => d.capacity_mw),
        backgroundColor: fuelData.map(d => fuelColors[d.fuel] || fuelColors['Other']),
        borderColor: '#ffffff',
        borderWidth: 2
      }
    ]
  }

  const total = fuelData.reduce((sum, d) => sum + d.capacity_mw, 0)

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      },
      tooltip: {
        callbacks: {
          label: context => {
            const value = context.parsed
            const percent = total ? ((value / total) * 100).toFixed(1) : 0
            return `${value.toLocaleString()} MW (${percent}%)`
          }
        },
        backgroundColor: 'white',
        titleColor: '#3d4a5d',
        bodyColor: '#3d4a5d',
        borderColor: '#3d4a5d',
        borderWidth: 1
      }
    }
  }

  return (
    <div className="relative h-[360px] max-w-[480px] mx-auto">
      <Pie data={chartData} options={options} />
    </div>
  )
}