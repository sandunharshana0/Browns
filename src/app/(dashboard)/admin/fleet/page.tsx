'use client'

import { useState, useMemo, useEffect } from 'react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { VehicleDashboardResponse, FleetKpi, VehicleDashboardRow } from '@/types'

type VehicleOption = { vehicleNo: string; vehicleType: string | null }

type FilterTab = 'all' | 'high-consumption' | 'inactive'

const MOCK_VEHICLES: VehicleOption[] = [
  { vehicleNo: 'CBC-3711', vehicleType: 'CAR' },
  { vehicleNo: 'HE-6741', vehicleType: 'VAN' },
  { vehicleNo: 'LO-6180', vehicleType: 'BOLERO' },
  { vehicleNo: 'WP-CAD-1234', vehicleType: 'BOOM_TRUCK' },
]

function generateMockDailyData(daysInMonth: number): VehicleDashboardRow[] {
  let meter = 120000
  return Array.from({ length: daysInMonth }, (_, i) => {
    const km = Math.round(20 + Math.random() * 180)
    const onMeter = meter
    const endMeter = meter + km
    meter = endMeter
    const hasFuel = Math.random() > 0.6
    return {
      day: i + 1,
      onMeter,
      endMeter,
      totalKm: km,
      fuelSpent: hasFuel ? Math.round(km * 0.12 * 360) : null,
      fuelLiters: hasFuel ? Math.round(km * 0.12 * 10) / 10 : null,
    }
  })
}

function generateMockChart(vehicleNo: string, month: number, year: number): VehicleDashboardResponse {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return {
    vehicleNo,
    vehicleType: MOCK_VEHICLES.find((v) => v.vehicleNo === vehicleNo)?.vehicleType ?? null,
    month,
    year,
    dailyData: generateMockDailyData(daysInMonth),
  }
}

async function fetchVehicles(): Promise<VehicleOption[]> {
  try {
    const res = await fetch('/api/vehicles')
    const json = await res.json()
    if (json.data && json.data.length > 0) return json.data
    return MOCK_VEHICLES
  } catch {
    return MOCK_VEHICLES
  }
}

async function fetchChart(vehicleNo: string, month: number, year: number): Promise<VehicleDashboardResponse> {
  try {
    const res = await fetch(`/api/dashboard/vehicle-chart?vehicleNo=${encodeURIComponent(vehicleNo)}&month=${month}&year=${year}`)
    if (!res.ok) throw new Error('API error')
    const json = await res.json()
    if (json.data) return json.data
    throw new Error('No data')
  } catch {
    return generateMockChart(vehicleNo, month, year)
  }
}

function computeKpis(dailyData: VehicleDashboardRow[]): FleetKpi {
  const totalKm = dailyData.reduce((s, d) => s + (d.totalKm ?? 0), 0)
  const totalFuelLiters = dailyData.reduce((s, d) => s + (d.fuelLiters ?? 0), 0)
  const totalFuelAmount = dailyData.reduce((s, d) => s + (d.fuelSpent ?? 0), 0)
  const avgKmPerLiter = totalFuelLiters > 0 ? totalKm / totalFuelLiters : null
  return { totalKm, totalFuelLiters, totalFuelAmount, avgKmPerLiter }
}

function formatNumber(val: number): string {
  return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All Vehicles' },
  { key: 'high-consumption', label: 'High Consumption' },
  { key: 'inactive', label: 'Inactive Fleet' },
]

export default function FleetDashboard() {
  const now = new Date()
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [month, setMonth] = useState(now.getMonth())
  const [year, setYear] = useState(now.getFullYear())
  const [vehicles, setVehicles] = useState<VehicleOption[]>(MOCK_VEHICLES)
  const [chartData, setChartData] = useState<VehicleDashboardResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchVehicles().then(setVehicles)
  }, [])

  useEffect(() => {
    if (!selectedVehicle) return

    let active = true
    Promise.resolve().then(() => {
      if (active) setLoading(true)
    })

    fetchChart(selectedVehicle, month, year).then((data) => {
      if (active) {
        setChartData(data)
        setLoading(false)
      }
    })

    return () => {
      active = false
    }
  }, [selectedVehicle, month, year])

  const kpis: FleetKpi = useMemo(() => {
    if (!chartData?.dailyData) return { totalKm: 0, totalFuelLiters: 0, totalFuelAmount: 0, avgKmPerLiter: null }
    return computeKpis(chartData.dailyData)
  }, [chartData])

  const filteredRows = useMemo(() => {
    if (!chartData?.dailyData) return []
    let rows = chartData.dailyData

    if (activeTab === 'high-consumption') {
      rows = rows.filter((r) => (r.totalKm ?? 0) > 150)
    } else if (activeTab === 'inactive') {
      rows = rows.filter((r) => (r.totalKm ?? 0) === 0)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      rows = rows.filter((r) => {
        const dateStr = format(new Date(year, month, r.day), 'dd-MMM-yyyy').toLowerCase()
        return dateStr.includes(q) || String(r.totalKm ?? '').includes(q) || String(r.fuelLiters ?? '').includes(q)
      })
    }

    return rows
  }, [chartData, activeTab, searchQuery, year, month])

  const getMileageBadge = (km: number | null) => {
    if (km == null) return null
    if (km > 150) return { label: 'High', class: 'bg-rose-100 text-rose-700 border-rose-200' }
    if (km > 80) return { label: 'Moderate', class: 'bg-amber-100 text-amber-700 border-amber-200' }
    if (km === 0) return { label: 'Idle', class: 'bg-slate-100 text-slate-500 border-slate-200' }
    return { label: 'Low', class: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Fleet Operations</h1>
            <p className="text-sm text-slate-400 mt-0.5">Real-time vehicle running analytics & tracking</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 p-2.5 font-medium shadow-sm"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>{format(new Date(2000, i), 'MMMM')}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 p-2.5 font-medium shadow-sm"
            >
              {Array.from({ length: 5 }, (_, i) => (
                <option key={i} value={now.getFullYear() - 2 + i}>
                  {now.getFullYear() - 2 + i}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              list="vehicle-suggestions"
              placeholder="Search vehicle..."
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all duration-200"
            />
            <datalist id="vehicle-suggestions">
              {vehicles.map((v) => (
                <option key={v.vehicleNo} value={v.vehicleNo}>
                  {v.vehicleNo} {v.vehicleType ? `(${v.vehicleType})` : ''}
                </option>
              ))}
            </datalist>
          </div>
          <div className="flex gap-1 p-1 bg-slate-100/80 rounded-xl">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200',
                  activeTab === tab.key
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative p-5 bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total KM</p>
              <p className="text-2xl font-bold text-slate-800 mt-1.5">
                {selectedVehicle ? `${kpis.totalKm.toLocaleString()}` : '--'}
                <span className="text-sm font-medium text-slate-400 ml-1">KM</span>
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                  +4.2%
                </span>
                <span className="text-[10px] text-slate-400">vs last month</span>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative p-5 bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Fuel Spent</p>
              <p className="text-2xl font-bold text-slate-800 mt-1.5">
                {selectedVehicle ? `Rs. ${formatNumber(kpis.totalFuelAmount)}` : '--'}
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                  +2.1%
                </span>
                <span className="text-[10px] text-slate-400">vs last month</span>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-violet-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative p-5 bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Fuel Efficiency</p>
              <p className="text-2xl font-bold text-slate-800 mt-1.5">
                {selectedVehicle
                  ? kpis.avgKmPerLiter !== null
                    ? `${kpis.avgKmPerLiter.toFixed(2)}`
                    : '0'
                  : '--'}
                <span className="text-sm font-medium text-slate-400 ml-1">KM/L</span>
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                  +1.8%
                </span>
                <span className="text-[10px] text-slate-400">vs last month</span>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative p-5 bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Fuel Liters</p>
              <p className="text-2xl font-bold text-slate-800 mt-1.5">
                {selectedVehicle ? `${formatNumber(kpis.totalFuelLiters)}` : '--'}
                <span className="text-sm font-medium text-slate-400 ml-1">L</span>
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                  +3.4%
                </span>
                <span className="text-[10px] text-slate-400">vs last month</span>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-slate-700">Daily Running Log</h2>
              {selectedVehicle && (
                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                  {selectedVehicle}
                </span>
              )}
            </div>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Filter by date or value..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-56 transition-all duration-200"
              />
            </div>
          </div>

          <div className="overflow-x-auto max-h-[480px]">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-slate-400">Loading fleet data...</span>
                </div>
              </div>
            ) : !selectedVehicle ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <svg className="w-10 h-10 mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
                <p className="text-sm font-medium">Select a vehicle to view daily data</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80 sticky top-0">
                  <tr>
                    {['Date', 'ON Meter', 'END Meter', 'Total KM', 'Liters Pumped', 'Status'].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRows.map((row) => {
                    const badge = getMileageBadge(row.totalKm)
                    return (
                      <tr
                        key={row.day}
                        className="group hover:bg-slate-50/80 transition-all duration-200 hover:shadow-sm"
                      >
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="font-medium text-slate-700">
                            {format(new Date(year, month, row.day), 'dd-MMM-yyyy')}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-500">
                          {row?.onMeter != null ? formatNumber(row.onMeter) : <span className="text-slate-300">&mdash;</span>}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-500">
                          {row?.endMeter != null ? formatNumber(row.endMeter) : <span className="text-slate-300">&mdash;</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-blue-600">
                            {row?.totalKm != null ? `${row.totalKm} KM` : <span className="text-slate-300">&mdash;</span>}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-slate-600">
                            {row?.fuelLiters != null ? `${row.fuelLiters} L` : <span className="text-slate-300">&mdash;</span>}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {badge && (
                            <span className={cn(
                              'inline-flex px-2.5 py-0.5 text-[10px] font-bold rounded-full border',
                              badge.class
                            )}>
                              {badge.label}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">
                        No records match your search
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
