"use client"

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Zap, BarChart3, Factory } from 'lucide-react'

/**
 * Displays high-level KPIs for either global or single-country mode.
 */
export default function KpiStats({ selectedCountries = [] }) {
  const [top, setTop] = useState(null)
  const [fuels, setFuels] = useState(null)
  const [countrySummary, setCountrySummary] = useState(null)
  const [globalTotals, setGlobalTotals] = useState({ totalPlants: null, totalCapacityMw: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    async function load() {
      try {
        setLoading(true)
        setError(null)
        // If a single country is selected, load its summary (via country code mapping)
        if (Array.isArray(selectedCountries) && selectedCountries.length === 1) {
          const country = selectedCountries[0]
          // map country_long -> country code
          const listRes = await fetch('/api/countries', { cache: 'no-store' })
          if (!listRes.ok) throw new Error('Failed to load country mapping')
          const listJson = await listRes.json()
          const list = listJson.data || listJson
          const match = Array.isArray(list) ? list.find(c => (c.country_long || c.country) === country) : null
          const code = match?.country || null
          if (!code) throw new Error('Country code not found')
          const summaryRes = await fetch(`/api/countries/${encodeURIComponent(code)}`, { cache: 'no-store' })
          if (!summaryRes.ok) throw new Error('Failed to load country summary')
          const summaryJson = await summaryRes.json()
          if (!isMounted) return
          setCountrySummary(summaryJson.data || summaryJson)
          setTop(null)
          setFuels(null)
          setGlobalTotals({ totalPlants: null, totalCapacityMw: null })
        } else {
          const [topRes, fuelRes, plantsRes] = await Promise.all([
            fetch('/api/countries/stats/top?limit=25', { cache: 'no-store' }),
            fetch('/api/global/fuel-capacity', { cache: 'no-store' }),
            fetch('/api/power-plants?limit=1', { cache: 'no-store' })
          ])
          if (!topRes.ok || !fuelRes.ok || !plantsRes.ok) throw new Error('Failed to load stats')
          const topJson = await topRes.json()
          const fuelJson = await fuelRes.json()
          const plantsJson = await plantsRes.json()
          if (!isMounted) return
          setTop(topJson.data || topJson)
          setFuels(fuelJson.data || fuelJson)
          const totalPlants = Number(plantsJson.total || plantsJson.count || 0) || null
          const totalCapacityMw = Array.isArray(fuelJson.data || fuelJson)
            ? (fuelJson.data || fuelJson).reduce((acc, f) => acc + (Number(f.capacity_mw) || 0), 0)
            : null
          setGlobalTotals({
            totalPlants,
            totalCapacityMw: totalCapacityMw != null ? Math.round(totalCapacityMw) : null,
          })
          setCountrySummary(null)
        }
      } catch (e) {
        if (isMounted) setError(e.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    load()
    return () => { isMounted = false }
  }, [selectedCountries])

  const kpis = useMemo(() => {
    // Single country mode
    if (countrySummary?.summary) {
      const s = countrySummary.summary
      return {
        mode: 'country',
        totalCapacityMw: s.total_capacity ? Math.round(Number(s.total_capacity)) : null,
        totalPlants: s.total_plants ? Number(s.total_plants) : null,
        avgCapacity: s.avg_capacity ? Math.round(Number(s.avg_capacity)) : null,
      }
    }
    // Global mode
    if (!top || !fuels) return null
    const totalCapacityMw = globalTotals.totalCapacityMw
    const totalPlants = globalTotals.totalPlants
    const avgCapacity = totalCapacityMw != null && totalPlants != null && totalPlants > 0
      ? Math.round(totalCapacityMw / totalPlants)
      : null
    return {
      mode: 'global',
      totalCapacityMw,
      totalPlants,
      avgCapacity,
    }
  }, [top, fuels, countrySummary, globalTotals])

  const items = [
    {
      label: 'Total Capacity',
      value: kpis?.totalCapacityMw != null ? `${kpis.totalCapacityMw.toLocaleString()} MW` : '—',
      icon: <Zap className="h-5 w-5 text-[#3d4a5d]" />,
    },
    {
      label: 'Total Plants',
      value: kpis?.totalPlants != null ? kpis.totalPlants.toLocaleString() : '—',
      icon: <Factory className="h-5 w-5 text-[#3d4a5d]" />,
    },
    {
      label: 'Avg Plant Capacity',
      value: kpis?.avgCapacity != null ? `${kpis.avgCapacity.toLocaleString()} MW` : '—',
      icon: <BarChart3 className="h-5 w-5 text-[#3d4a5d]" />,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((it) => (
        <Card key={it.label} className="dashboard-card">
          <CardContent className="p-5 min-h-[110px] flex items-center">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">{it.label}</div>
                <div className="mt-1 text-3xl font-bold text-[#3d4a5d]">{loading ? '…' : it.value}</div>
              </div>
              <div className="h-10 w-10 rounded-full bg-[#3d4a5d]/10 flex items-center justify-center">
                {it.icon}
              </div>
            </div>
            {error && (
              <div className="mt-2 text-xs text-red-500">{error}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}


