export interface VehicleDashboardRow {
  day: number
  onMeter: number | null
  endMeter: number | null
  totalKm: number | null
  fuelSpent: number | null
  fuelLiters: number | null
}

export interface VehicleDashboardResponse {
  vehicleNo: string
  vehicleType: string | null
  month: number
  year: number
  dailyData: VehicleDashboardRow[]
}

export interface FleetKpi {
  totalKm: number
  totalFuelLiters: number
  totalFuelAmount: number
  avgKmPerLiter: number | null
}

export interface AttendanceBulkRecord {
  employeeNo: string
  status: string
}

export interface AttendanceBulkResponse {
  count: number
  records: AttendanceBulkRecord[]
}

export interface SelectOption {
  label: string
  value: string
}
