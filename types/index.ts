export interface UserProfile {
  uid: string
  email: string
  name: string
  role: "manager" | "employee" | "driver" | "report_only_manager"
  createdAt: string
  profileImage?: string
  active?: boolean
  phone?: string
  position?: string
  updatedAt?: string
}

export interface UserData {
  name: string
  email: string
  role: "manager" | "employee" | "driver" | "report_only_manager"
  createdAt: string
  profileImage?: string
  active?: boolean
  phone?: string
  position?: string
  updatedAt?: string
}

export interface ParkingRecord {
  id: string
  plateNumber: string
  entryTime: string
  exitTime?: string
  status: "parked" | "completed"
  duration?: number
  amount?: number
  employeeId: string
  employeeName: string
  type?: "entry" | "exit" | "completed"
  carBrand?: string
  parkingArea?: string
  notes?: string
  paymentStatus?: "paid" | "unpaid"
  cashAmount?: number
  cardAmount?: number
  transferAmount?: number
  paidAt?: string
  updatedAt?: string
  updatedBy?: string
  images?: string[]
  driverName?: string
  mechanicName?: string
  timestamp: string
}

export interface SiteConfig {
  siteName: string
  siteLogo: string
  siteBackground?: string
  updatedAt?: string
  updatedBy?: string
}

export interface PricingConfig {
  leather: {
    firstHour: number
    subsequentHour: number
  }
  spare: {
    firstHour: number
    subsequentHour: number
  }
  general: {
    firstHour: number
    subsequentHour: number
  }
  updatedAt?: string
  updatedBy?: string
}

export interface ReportFilter {
  startDate?: string
  endDate?: string
  employeeId?: string
  status?: "all" | "parked" | "completed"
  plateNumber?: string
  year?: string
  month?: string
  carNumber?: string
  mechanicName?: string
  paymentStatus?: "paid" | "unpaid"
}

export interface DashboardStats {
  totalCustomers: number
  totalRevenue: number
  currentlyParked: number
  todayRevenue: number
  weeklyRevenue?: number
  monthlyRevenue?: number
  activeRecords: number
  todayCustomers: number
  averageSessionTime: number
  averageRevenue: number
}

export interface ChartData {
  name: string
  value: number
  date?: string
}

export interface DriverRegistration {
  email: string
  password: string
  name: string
  phone: string
  role: "manager" | "employee" | "driver"
  createdAt: string
}
