"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Globe, PieChart, Settings, Home } from 'lucide-react'
import dynamic from 'next/dynamic'

const PowerPlantMap = dynamic(() => import('@/components/map/PowerPlantMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3d4a5d]"></div>
      <p className="ml-3 text-gray-600">Loading map...</p>
    </div>
  )
})
import TopCountriesTable from '@/components/TopCountriesTable'
import KpiStats from '@/components/KpiStats'
const CountryGenerationChart = dynamic(() => import('@/components/CountryGenerationChart'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3d4a5d]"></div>
      <p className="ml-3 text-gray-600">Loading chart...</p>
    </div>
  )
})
import CountrySelector from '@/components/CountrySelector'
const CountryDataEditor = dynamic(() => import('@/components/CountryDataEditor'), { ssr: false })
const GlobalFuelPieChart = dynamic(() => import('@/components/GlobalFuelPieChart'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3d4a5d]"></div>
      <p className="ml-3 text-gray-600">Loading chart...</p>
    </div>
  )
})

export default function Dashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [selectedCountries, setSelectedCountries] = useState([])


  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <div className={`dashboard-sidebar hidden md:block ${sidebarCollapsed ? 'w-16' : 'w-64'} h-screen fixed left-0 top-0 z-30 transition-all duration-300`}>
        <div className="p-4 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <h2 className={`font-bold text-white ${sidebarCollapsed ? 'hidden' : 'block'}`}>QUANTUM</h2>
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-white hover:bg-white/10 p-2 rounded-full"
            >
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>
          
          <nav className="flex-1">
            <ul className="space-y-2">
              <li>
                <a href="#" className="flex items-center p-3 rounded-lg hover:bg-white/10 text-white">
                  <Home className="h-5 w-5" />
                  {!sidebarCollapsed && <span className="ml-3">Dashboard</span>}
                </a>
              </li>
              <li>
                <a href="#overview" className="flex items-center p-3 rounded-lg hover:bg-white/10 text-white">
                  <Globe className="h-5 w-5" />
                  {!sidebarCollapsed && <span className="ml-3">Global Map</span>}
                </a>
              </li>
              <li>
                <a href="#analytics" className="flex items-center p-3 rounded-lg hover:bg-white/10 text-white">
                  <BarChart3 className="h-5 w-5" />
                  {!sidebarCollapsed && <span className="ml-3">Analytics</span>}
                </a>
              </li>
              <li>
                <a href="#top25" className="flex items-center p-3 rounded-lg hover:bg-white/10 text-white">
                  <PieChart className="h-5 w-5" />
                  {!sidebarCollapsed && <span className="ml-3">Top 25</span>}
                </a>
              </li>
              <li>
                <a href="#editor" className="flex items-center p-3 rounded-lg hover:bg-white/10 text-white">
                  <Settings className="h-5 w-5" />
                  {!sidebarCollapsed && <span className="ml-3">Editor</span>}
                </a>
              </li>
            </ul>
          </nav>
          
          <div className={`mt-auto ${sidebarCollapsed ? 'hidden' : 'block'}`}>
            <div className="p-3 text-xs text-white/60">
              <p>© 2025 QUANTUM Capital</p>
              <p>Dashboard v1.0</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className={`transition-all duration-300 ml-0 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'} flex-1`}>
        <header className="dashboard-header sticky top-0 z-20">
          <div className="mx-auto max-w-[1600px] py-4 px-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Global Power Generation Explorer</h1>
              <div className="flex items-center space-x-4">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                  QC
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <main className="mx-auto max-w-[1600px] py-8 px-6">
          <div className="mb-8">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold text-[#3d4a5d]">Dashboard Overview</h2>
              <p className="text-gray-600">Welcome to your dashboard</p>
            </div>
            <div className="mt-6">
              <KpiStats selectedCountries={selectedCountries} />
            </div>
          </div>
          <section id="overview" className="mb-8">
            <Card className="dashboard-card">
              <CardHeader className="bg-[#3e5e8d] text-white border-b">
                <CardTitle className="text-white">Global Energy Map</CardTitle>
              <CardDescription className="text-white/80">
                Interactive map showing power plants worldwide by fuel type and capacity
              </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[68vh] min-h-[520px] lg:h-[78vh]">
                  <PowerPlantMap onCountrySelect={setSelectedCountries} />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Trends and composition row */}
          <div id="analytics"></div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
            <Card className="dashboard-card xl:col-span-2">
              <CardHeader className="bg-[#3e5e8d] text-white border-b">
                <CardTitle className="text-white">Country Electricity Generation</CardTitle>
                <CardDescription className="text-white/80">
                  Annual generation for up to 5 selected countries (2013-2019)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <CountrySelector selected={selectedCountries} onChange={setSelectedCountries} max={5} />
                </div>
                <CountryGenerationChart countries={selectedCountries} />
              </CardContent>
            </Card>

            <Card className="dashboard-card">
              <CardHeader className="bg-[#3e5e8d] text-white border-b">
                <CardTitle className="text-white">Global Primary Fuel Share</CardTitle>
                <CardDescription className="text-white/80">
                  Share of global generating capacity by primary fuel
                </CardDescription>
              </CardHeader>
              <CardContent>
                 <GlobalFuelPieChart selectedCountries={selectedCountries} />
              </CardContent>
            </Card>
          </div>

          
          


          <Card id="top25" className="dashboard-card mb-6 max-w-4xl mx-auto w-full">
            <CardHeader className="bg-[#3e5e8d] text-white border-b">
              <CardTitle className="text-white">Top Countries by Generating Capacity</CardTitle>
              <CardDescription className="text-white/80">
                Top 25 countries ranked by total installed capacity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TopCountriesTable />
            </CardContent>
          </Card>
          {/* Map moved to top as first section */}
          
          

          <Card id="editor" className="dashboard-card mb-6">
            <CardHeader className="bg-[#3e5e8d] text-white border-b">
              <CardTitle className="text-white">Country Data Editor</CardTitle>
              <CardDescription className="text-white/80">
                Edit capacity and annual generation overrides for a single country
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CountryDataEditor />
            </CardContent>
          </Card>
        </main>
        
        <footer className="bg-[#3d4a5d] text-white py-6">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">QUANTUM Capital Group</h3>
                <p className="text-sm text-white/70">
                  Providing data-driven insights since 2010.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-4">Quick Links</h4>
                <ul className="space-y-2 text-sm text-white/70">
                  <li><a href="#" className="hover:text-white">Dashboard</a></li>
                  <li><a href="#overview" className="hover:text-white">Overview</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-white/20 text-sm text-white/60">
              <p>© 2025 QUANTUM Capital Group. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
} 