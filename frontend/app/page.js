"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Globe, LineChart, PieChart, Settings, Users, Home, Info } from 'lucide-react'
import PowerPlantMap from '@/components/map/PowerPlantMap'

export default function Dashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [selectedCountries, setSelectedCountries] = useState([])

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <div className={`dashboard-sidebar ${sidebarCollapsed ? 'w-16' : 'w-64'} h-screen fixed left-0 top-0 z-30 transition-all duration-300`}>
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
                <a href="#analytics" className="flex items-center p-3 rounded-lg hover:bg-white/10 text-white/80">
                  <BarChart3 className="h-5 w-5" />
                  {!sidebarCollapsed && <span className="ml-3">Analytics</span>}
                </a>
              </li>
              <li>
                <a href="#reports" className="flex items-center p-3 rounded-lg hover:bg-white/10 text-white/80">
                  <PieChart className="h-5 w-5" />
                  {!sidebarCollapsed && <span className="ml-3">Reports</span>}
                </a>
              </li>
              <li>
                <a href="#trends" className="flex items-center p-3 rounded-lg hover:bg-white/10 text-white/80">
                  <LineChart className="h-5 w-5" />
                  {!sidebarCollapsed && <span className="ml-3">Trends</span>}
                </a>
              </li>
              <li>
                <a href="#users" className="flex items-center p-3 rounded-lg hover:bg-white/10 text-white/80">
                  <Users className="h-5 w-5" />
                  {!sidebarCollapsed && <span className="ml-3">Users</span>}
                </a>
              </li>
              <li>
                <a href="#settings" className="flex items-center p-3 rounded-lg hover:bg-white/10 text-white/80">
                  <Settings className="h-5 w-5" />
                  {!sidebarCollapsed && <span className="ml-3">Settings</span>}
                </a>
              </li>
              <li>
                <a href="#about" className="flex items-center p-3 rounded-lg hover:bg-white/10 text-white/80">
                  <Info className="h-5 w-5" />
                  {!sidebarCollapsed && <span className="ml-3">About</span>}
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
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'} flex-1`}>
        <header className="dashboard-header sticky top-0 z-20">
          <div className="container mx-auto py-4 px-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 rounded-full px-4 py-1 text-sm">
                  Last updated: August 6, 2025
                </div>
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                  QC
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto py-8 px-6">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#3d4a5d] mb-2">Dashboard Overview</h2>
            <p className="text-gray-600">Welcome to your dashboard</p>
            {selectedCountries.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Selected Countries:</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCountries.map((country, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {country}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="dashboard-card">
              <CardHeader className="bg-[#3d4a5d]/5 border-b">
                <CardTitle className="text-[#3d4a5d]">Section 1</CardTitle>
                <CardDescription>
                  Description for section 1
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-40 flex items-center justify-center bg-gray-100 rounded-md">
                  <p className="text-gray-500">Content placeholder</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="dashboard-card">
              <CardHeader className="bg-[#3d4a5d]/5 border-b">
                <CardTitle className="text-[#3d4a5d]">Section 2</CardTitle>
                <CardDescription>
                  Description for section 2
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-40 flex items-center justify-center bg-gray-100 rounded-md">
                  <p className="text-gray-500">Content placeholder</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="dashboard-card">
              <CardHeader className="bg-[#3d4a5d]/5 border-b">
                <CardTitle className="text-[#3d4a5d]">Section 3</CardTitle>
                <CardDescription>
                  Description for section 3
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-40 flex items-center justify-center bg-gray-100 rounded-md">
                  <p className="text-gray-500">Content placeholder</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="dashboard-card mb-6">
            <CardHeader className="bg-[#3d4a5d]/5 border-b">
              <CardTitle className="text-[#3d4a5d]">Global Energy Map</CardTitle>
              <CardDescription>
                Interactive map showing power plants worldwide by fuel type and capacity
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-96">
                <PowerPlantMap onCountrySelect={setSelectedCountries} />
              </div>
            </CardContent>
          </Card>
        </main>
        
        <footer className="bg-[#3d4a5d] text-white py-6">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                  <li><a href="#analytics" className="hover:text-white">Analytics</a></li>
                  <li><a href="#reports" className="hover:text-white">Reports</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-4">Contact</h4>
                <ul className="space-y-2 text-sm text-white/70">
                  <li>info@quantumcapital.com</li>
                  <li>+1 (555) 123-4567</li>
                  <li>123 Finance Street, New York, NY</li>
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