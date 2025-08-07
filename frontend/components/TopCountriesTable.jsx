"use client"

import { useEffect, useState, useMemo } from 'react'

export default function TopCountriesTable() {
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortConfig, setSortConfig] = useState({ key: 'total_capacity', direction: 'desc' })

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/countries/stats/top?limit=25', { cache: 'no-store' })
        if (!response.ok) {
          throw new Error('Failed to fetch country data')
        }
        const data = await response.json()
        const formatted = (data.data || data).map(c => ({
          ...c,
          plant_count: Number(c.plant_count),
          total_capacity: Number(c.total_capacity),
          avg_capacity: Number(c.avg_capacity)
        }))
        setCountries(formatted)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchCountries()

    // Listen for edits to force refresh
    const onUpdated = () => fetchCountries()
    window.addEventListener('country-data-updated', onUpdated)
    return () => window.removeEventListener('country-data-updated', onUpdated)
  }, [])

  const sortedCountries = useMemo(() => {
    const sorted = [...countries]
    sorted.sort((a, b) => {
      let aVal = a[sortConfig.key]
      let bVal = b[sortConfig.key]
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [countries, sortConfig])

  const requestSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key && prev.direction === 'asc') {
        return { key, direction: 'desc' }
      }
      return { key, direction: 'asc' }
    })
  }

  const sortIndicator = (key) => {
    if (sortConfig.key !== key) return null
    return sortConfig.direction === 'asc' ? '▲' : '▼'
  }

  if (loading) return <p>Loading...</p>
  if (error) return <p className="text-red-500">{error}</p>

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Rank</th>
            <th
              className="px-4 py-2 text-left text-sm font-medium text-gray-500 cursor-pointer"
              onClick={() => requestSort('country_long')}
            >
              Country {sortIndicator('country_long')}
            </th>
            <th
              className="px-4 py-2 text-right text-sm font-medium text-gray-500 cursor-pointer"
              onClick={() => requestSort('total_capacity')}
            >
              Total Capacity (MW) {sortIndicator('total_capacity')}
            </th>
            <th
              className="px-4 py-2 text-right text-sm font-medium text-gray-500 cursor-pointer"
              onClick={() => requestSort('plant_count')}
            >
              Plants {sortIndicator('plant_count')}
            </th>
            <th
              className="px-4 py-2 text-right text-sm font-medium text-gray-500 cursor-pointer"
              onClick={() => requestSort('avg_capacity')}
            >
              Avg Capacity (MW) {sortIndicator('avg_capacity')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sortedCountries.map((c, idx) => (
            <tr key={c.country} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-4 py-2 text-sm text-gray-700">{idx + 1}</td>
              <td className="px-4 py-2 text-sm text-gray-700">{c.country_long}</td>
              <td className="px-4 py-2 text-sm text-gray-700 text-right">{Math.round(c.total_capacity).toLocaleString()}</td>
              <td className="px-4 py-2 text-sm text-gray-700 text-right">{c.plant_count}</td>
              <td className="px-4 py-2 text-sm text-gray-700 text-right">{Math.round(c.avg_capacity).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
} 