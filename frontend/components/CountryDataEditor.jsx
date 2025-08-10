"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Plus, X } from 'lucide-react'
import CountrySelector from '@/components/CountrySelector'

function Toast({ variant = 'default', title, description }) {
  if (!title && !description) return null
  const color = variant === 'destructive' ? 'text-red-700 bg-red-50 border-red-200' : 'text-green-700 bg-green-50 border-green-200'
  return (
    <div className={`p-3 mb-3 border rounded ${color}`}>
      {title && <div className="font-semibold">{title}</div>}
      {description && <div className="text-sm">{description}</div>}
    </div>
  )
}

export default function CountryDataEditor() {
  const [refreshToken, setRefreshToken] = useState(0)
  const [toast, setToast] = useState(null)
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [capacityMw, setCapacityMw] = useState('')
  const [generationData, setGenerationData] = useState({})
  const [deletedYears, setDeletedYears] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newYear, setNewYear] = useState('')
  const [newGeneration, setNewGeneration] = useState('')

  // Prevent map selections from auto-populating editor
  useEffect(() => {
    function onExternalSelect(e) {
      const source = e.detail?.source
      if (source === 'map') {
        // ignore map-originated selections
        return
      }
      const countries = e.detail?.countries || []
      if (countries.length > 0) setSelectedCountry(countries[0])
    }
    window.addEventListener('country-selected', onExternalSelect)
    return () => window.removeEventListener('country-selected', onExternalSelect)
  }, [])

  const showToast = useCallback((t) => {
    setToast(t)
    setTimeout(() => setToast(null), 3500)
  }, [])

  const fetchCountryDetails = useCallback(async (countryName) => {
    setLoading(true)
    try {
      // Generation (includes reported/estimated/effective)
      const genRes = await fetch(`/api/countries/${encodeURIComponent(countryName)}/generation`)
      if (!genRes.ok) throw new Error('Failed to fetch generation')
      const genJson = await genRes.json()
      const arr = genJson.data || genJson
      const genMap = {}
      ;(arr || []).forEach((row) => {
      const reported = row?.reported_generation_gwh
      const estimated = row?.estimated_generation_gwh
      const effective = row?.effective_generation_gwh
      const chosen = effective ?? reported ?? estimated
      if (chosen !== null && chosen !== undefined && !Number.isNaN(Number(chosen)) && Number(chosen) > 0) {
        genMap[String(row.year)] = Number(chosen)
      }
      })

      // Capacity
      const capRes = await fetch(`/api/countries/details?countryName=${encodeURIComponent(countryName)}`)
      if (!capRes.ok) throw new Error('Failed to fetch capacity')
      const capJson = await capRes.json()
      const capacity = capJson.data?.capacity_mw ?? capJson.capacity_mw

      setCapacityMw(capacity ?? '')
      setGenerationData(genMap)
      setDeletedYears([])
    } catch (err) {
      showToast({ title: 'Error fetching data', description: err.message || 'Could not load country data.', variant: 'destructive' })
      setCapacityMw('')
      setGenerationData({})
      setDeletedYears([])
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    if (selectedCountry) {
      fetchCountryDetails(selectedCountry)
    } else {
      setCapacityMw('')
      setGenerationData({})
    }
  }, [selectedCountry, fetchCountryDetails])

  const handleCapacityChange = (e) => {
    const value = e.target.value
    setCapacityMw(value === '' ? '' : Number(value))
  }

  const handleGenerationChange = (year, e) => {
    const value = e.target.value
    if (value === '') {
      setGenerationData((prev) => {
        const next = { ...prev }
        delete next[year]
        return next
      })
      setDeletedYears((prev) => (prev.includes(year) ? prev : [...prev, year]))
    } else {
      setGenerationData((prev) => ({ ...prev, [year]: Number(value) }))
      setDeletedYears((prev) => prev.filter((y) => y !== year))
    }
  }

  const handleAddYear = () => {
    if (newYear && newGeneration !== '' && !isNaN(Number(newGeneration))) {
      setGenerationData((prev) => ({ ...prev, [newYear]: Number(newGeneration) }))
      setDeletedYears((prev) => prev.filter((y) => y !== newYear))
      setNewYear('')
      setNewGeneration('')
      return
    }
    showToast({ title: 'Invalid Input', description: 'Please enter a valid year and generation value.', variant: 'destructive' })
  }

  const handleRemoveYear = (yearToRemove) => {
    setGenerationData((prev) => {
      const next = { ...prev }
      delete next[yearToRemove]
      return next
    })
    setDeletedYears((prev) => (prev.includes(yearToRemove) ? prev : [...prev, yearToRemove]))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedCountry) {
      showToast({ title: 'No Country Selected', description: 'Please select a country to update.', variant: 'destructive' })
      return
    }
    // Incorporate pending new year/value into a local map for validation and submission
    const genForSubmit = { ...generationData }
    deletedYears.forEach((year) => {
      genForSubmit[year] = null
    })
    const hasPendingYear = newYear && newYear !== ''
    const pendingValueIsNumber = newGeneration !== '' && !Number.isNaN(Number(newGeneration))
    if (hasPendingYear && pendingValueIsNumber) {
      genForSubmit[newYear] = Number(newGeneration)
    }

    // Client-side sanity check: generation cannot exceed theoretical max given capacity
    try {
      const capMw = capacityMw === '' ? undefined : Number(capacityMw)
      if (capMw && Number.isFinite(capMw) && capMw > 0) {
        const maxGwh = capMw * 8.76
        const violations = Object.entries(genForSubmit)
          .filter(([, v]) => v !== '' && v !== undefined)
          .filter(([, v]) => Number(v) > maxGwh)
          .map(([y, v]) => `${y}: ${v} GWh`)
        if (violations.length > 0) {
          showToast({
            title: 'Generation exceeds capacity limit',
            description: `These years exceed max ${maxGwh.toFixed(2)} GWh for ${capMw} MW: ${violations.join(', ')}`,
            variant: 'destructive'
          })
          return
        }
      }
    } catch (_) {
      // ignore client-side validation error
    }
    setSubmitting(true)
    try {
      const payload = {
        countryName: selectedCountry,
        capacity_mw: capacityMw === '' ? undefined : capacityMw,
        generation_gwh: Object.fromEntries(Object.entries(genForSubmit).filter(([, v]) => v !== '' && v !== undefined))
      }

      const res = await fetch('/api/countries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error || 'Failed to update data')
      }
      showToast({ title: 'Update Successful', description: `${selectedCountry} data updated.` })
      // If a pending new year was present, reflect it in UI without requiring + button
      if (hasPendingYear) {
        if (pendingValueIsNumber) {
          setGenerationData((prev) => ({ ...prev, [newYear]: Number(newGeneration) }))
        } else {
          setGenerationData((prev) => ({ ...prev, [newYear]: undefined }))
          setDeletedYears((prev) => [...prev, newYear])
        }
        setNewYear('')
        setNewGeneration('')
      }
      setDeletedYears([])

      // Trigger listeners to refresh dependent data
      window.dispatchEvent(new CustomEvent('country-data-updated', { detail: { country: selectedCountry, at: Date.now() } }))
      setRefreshToken((t) => t + 1)
    } catch (err) {
      showToast({ title: 'Update Failed', description: err.message || 'An unexpected error occurred.', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const sortedYears = useMemo(() => Object.keys(generationData).sort((a, b) => parseInt(a) - parseInt(b)), [generationData])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {toast && <Toast {...toast} />}
      <div>
        <label htmlFor="country-select" className="mb-2 block text-sm font-medium text-gray-800">Select Country</label>
        <CountrySelector selected={selectedCountry ? [selectedCountry] : []} onChange={(arr) => setSelectedCountry(arr[0] || null)} max={1} />
      </div>

      {selectedCountry && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-4 text-sm text-gray-600">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading country data...
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="capacity_mw" className="mb-2 block text-sm font-medium text-gray-800">Capacity (MW)</label>
                <input id="capacity_mw" type="number" step="any" value={capacityMw} onChange={handleCapacityChange} placeholder="Enter total capacity in MW" min="0" className="w-full border rounded px-3 py-2 bg-white text-gray-900 placeholder-gray-500" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800">Electricity Generation (GWh per year)</label>
                <div className="space-y-3">
                  {sortedYears.map((year) => (
                    <div key={year} className="flex items-center space-x-2">
                      <input type="number" step="any" value={generationData[year] ?? ''} onChange={(e) => handleGenerationChange(year, e)} placeholder={`Generation for ${year}`} className="flex-1 border rounded px-3 py-2 bg-white text-gray-900 placeholder-gray-500" min="0" />
                      <span className="w-16 text-right font-medium text-gray-800">{year}</span>
                      <button type="button" onClick={() => handleRemoveYear(year)} className="p-2 rounded hover:bg-red-50 text-red-600">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2">
                    <input type="number" step="any" value={newGeneration} onChange={(e) => setNewGeneration(e.target.value === '' ? '' : Number(e.target.value))} placeholder="New Generation (GWh)" className="flex-1 border rounded px-3 py-2 bg-white text-gray-900 placeholder-gray-500" min="0" />
                    <input type="number" value={newYear} onChange={(e) => setNewYear(e.target.value)} placeholder="Year" className="w-24 border rounded px-3 py-2 bg-white text-gray-900 placeholder-gray-500" min="1900" max={new Date().getFullYear()} />
                    <button type="button" onClick={handleAddYear} className="p-2 rounded bg-gray-900 text-white">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full p-2 rounded bg-gray-900 text-white disabled:opacity-50" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 inline animate-spin" />} Update Data
              </button>
            </>
          )}
        </>
      )}
    </form>
  )
}


