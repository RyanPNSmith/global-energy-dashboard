"use client"

import { useState, useEffect } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Pie } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

// Plugin to render percentage labels on slices larger than 5%
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

// Define fuel type colors
const fuelColors = {
  Coal: '#3d4a5d',
  Gas: '#4d5b70',
  Oil: '#5d6b80',
  Hydro: '#6495ED',
  Nuclear: '#9370DB',
  Wind: '#20B2AA',
  Solar: '#FFD700',
  Biomass: '#228B22',
  Geothermal: '#FF4500',
  Waste: '#A52A2A',
  Other: '#808080'
}

export default function GlobalFuelPieChart() {
  const [fuelData, setFuelData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/global/fuel-capacity')
        if (!res.ok) {
          throw new Error('Failed to fetch fuel capacity data')
        }
        const json = await res.json()
        const data = json.data || json
        setFuelData(
          data.map(d => ({
            fuel: d.fuel || d.primary_fuel,
            capacity_mw: Number(d.capacity_mw)
          }))
        )
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

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
    <div className="h-[300px]">
      <Pie data={chartData} options={options} />
    </div>
  )
}