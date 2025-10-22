"use client"
import React from "react"

import { DialogFooter } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"

import { useState, useEffect } from "react"
import { onAuthStateChanged, createUserWithEmailAndPassword, signOut, type User } from "firebase/auth"
import { ref, onValue, set, remove, update, push } from "firebase/database"
import { auth, database } from "@/lib/firebase"
import type { UserProfile, DriverRegistration } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  UserPlus,
  Shield,
  Edit,
  Power,
  PowerOff,
  Settings,
  UserIcon,
  LogOut,
  Eye,
  Calendar,
  Download,
  TrendingUp,
  Users,
  Car,
  BarChart3,
  ChevronDown,
  X,
  Trash2,
} from "lucide-react"
import * as XLSX from "xlsx"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover" // Added Popover imports
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command" // Added Command imports

export default function ManagerPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  // Manager states
  const [managers, setManagers] = useState<UserProfile[]>([])
  // Director states - add new state for directors
  const [directors, setDirectors] = useState<UserProfile[]>([])
  // Driver states - add after managers states
  const [drivers, setDrivers] = useState<UserProfile[]>([])
  // Report states
  const [reportRecords, setReportRecords] = useState<any[]>([])
  const [filteredReportRecords, setFilteredReportRecords] = useState<any[]>([])
  // Remove year and month filters, add day and time filters
  const [reportFilterDay, setReportFilterDay] = useState("")
  const [reportFilterTime, setReportFilterTime] = useState("")
  const [reportFilterCarNumber, setReportFilterCarNumber] = useState("")
  const [reportFilterMechanic, setReportFilterMechanic] = useState<string[]>([]) // Changed to array for multi-select
  const [reportFilterPaymentStatus, setReportFilterPaymentStatus] = useState("") // New filter
  // Sorting states
  const [sortField, setSortField] = useState<string>("")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [reportLoading, setReportLoading] = useState(false)
  const [totalCashAmount, setTotalCashAmount] = useState(0)
  const [totalCardAmount, setTotalCardAmount] = useState(0)
  const [totalTransferAmount, setTotalTransferAmount] = useState(0)
  // Enhanced Dashboard states
  const [dashboardStats, setDashboardStats] = useState({
    totalCustomers: 0,
    totalRevenue: 0,
    activeRecords: 0,
    todayCustomers: 0,
    todayRevenue: 0,
    averageSessionTime: 0,
    averageRevenue: 0,
  })
  const [monthlyStats, setMonthlyStats] = useState<any[]>([])
  const [dailyStats, setDailyStats] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [dashboardLoading, setDashboardLoading] = useState(false)
  // Add these new states for custom date range
  const [customDateRange, setCustomDateRange] = useState({
    startDate: "",
    endDate: "",
    useCustomRange: false,
  })
  const [showDateRangePicker, setShowDateRangePicker] = useState(false)
  // Date range filter states
  const [showDateRangeDialog, setShowDateRangeDialog] = useState(false)
  const [dateRangeStart, setDateRangeStart] = useState("")
  const [dateRangeEnd, setDateRangeEnd] = useState("")
  const [deleteAfterExport, setDeleteAfterExport] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  // Image viewer states
  const [showImageViewer, setShowImageViewer] = useState(false)
  const [currentImages, setCurrentImages] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  // Employee states - now using UserProfile type for consistency
  const [employees, setEmployees] = useState<UserProfile[]>([])
  // Add state for login-enabled employees
  const [loginEmployees, setLoginEmployees] = useState<UserProfile[]>([])
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    position: "",
    phone: "",
    startDate: "",
    profileImage: "",
  })
  const [editingEmployee, setEditingEmployee] = useState<UserProfile | null>(null)
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false)
  const [employeeLoading, setEmployeeLoading] = useState(false)
  // Driver registration states
  const [newDriver, setNewDriver] = useState<DriverRegistration>({
    email: "",
    password: "",
    name: "",
    phone: "",
    role: "driver",
    createdAt: "",
  })
  const [registrationLoading, setRegistrationLoading] = useState(false)
  const [isNamePhoneAutoFilled, setIsNamePhoneAutoFilled] = useState(false) // Added for employee selection
  // Add "director" to the selectedRole type
  const [selectedRole, setSelectedRole] = useState<"manager" | "driver" | "employee">("employee")
  // Add this after the existing states, around line 100
  const [availableEmployees, setAvailableEmployees] = useState<any[]>([])
  // Edit driver states
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null) // Renamed from editingDriver
  const [editUserData, setEditUserData] = useState({
    // Renamed from editDriverData
    name: "",
    phone: "",
    email: "",
    newPassword: "",
  })
  const [editLoading, setEditLoading] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  // Profile dialog state
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [profileData, setProfileData] = useState({
    name: "",
    phone: "",
    email: "",
    profileImage: "",
  })
  const [profileLoading, setLoadingProfile] = useState(false)
  // Profile image and password states
  const [showPassword, setShowPassword] = useState(false) // Renamed from setShowConfirmPassword
  const [showConfirmPassword, setShowConfirmPassword] = useState(false) // Renamed from setShowPassword
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  // Payment status dialog states
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  // New states for split payment amounts
  const [cashAmountInput, setCashAmountInput] = useState(0)
  const [cardAmountInput, setCardAmountInput] = useState(0)
  const [transferAmountInput, setTransferAmountInput] = useState(0)
  const [paymentLoading, setPaymentLoading] = useState(false) // Changed to boolean
  // Add a new state variable for `initialAmountToPay`
  const [initialAmountToPay, setInitialAmountToPay] = useState(0)
  // Edit record dialog states
  const [showEditRecordDialog, setShowEditRecordDialog] = useState(false)
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [editRecordData, setEditRecordData] = useState({
    carNumber: "",
    mechanicName: "",
    carBrand: "",
    parkingArea: "", // Added this field
    position: "", // Added this field
    entryTime: "",
    exitTime: "",
    parkingDuration: "",
    amount: 0, // Added amount field
    images: [] as string[], // Added images field
  })
  const [editRecordLoading, setEditRecordLoading] = useState(false)
  // State for filter collapsible
  const [isFilterOpen, setIsFilterOpen] = useState(true)
  // Logout loading state
  const [logoutLoading, setLogoutLoading] = useState(false)

  // Function to get Mongolian area name (assuming pricing config is not available in manager)
  const getAreaNameInMongolian = (area: string): string => {
    const areaMap: { [key: string]: string } = {
      leather: "Тен",
      spare: "Сафари",
      general: "Талбай",
      safari: "Сафари талбай",
    }
    return areaMap[area?.toLowerCase()] || area || "-"
  }

  // Handle table sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Get sorted records
  const getSortedRecords = () => {
    if (!sortField) return filteredReportRecords

    return [...filteredReportRecords].sort((a, b) => {
      let aValue: any = ""
      let bValue: any = ""

      switch (sortField) {
        case "carNumber":
          aValue = a.carNumber || ""
          bValue = b.carNumber || ""
          break
        case "mechanicName":
          aValue = a.mechanicName || a.driverName || ""
          bValue = b.mechanicName || b.driverName || ""
          break
        case "position":
          const aEmployee = employees.find((emp) => emp.name === (a.mechanicName || a.driverName))
          const bEmployee = employees.find((emp) => emp.name === (b.mechanicName || b.driverName))
          aValue = aEmployee?.position || ""
          bValue = bEmployee?.position || ""
          break
        case "area":
          aValue = getAreaNameInMongolian(a.parkingArea || a.carBrand)
          bValue = getAreaNameInMongolian(b.parkingArea || b.carBrand)
          break
        case "carBrand":
          aValue = a.carBrand || ""
          bValue = b.carBrand || ""
          break
        case "entryTime":
          aValue = new Date(a.entryTime || 0).getTime()
          bValue = new Date(b.entryTime || 0).getTime()
          break
        case "exitTime":
          aValue = new Date(a.exitTime || 0).getTime()
          bValue = new Date(b.exitTime || 0).getTime()
          break
        case "amount":
          aValue = calculateParkingFeeForReport(a)
          bValue = calculateParkingFeeForReport(b)
          break
        case "paymentStatus":
          aValue = a.paymentStatus === "paid" ? 1 : 0
          bValue = b.paymentStatus === "paid" ? 1 : 0
          break
        default:
          return 0
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
      }
    })
  }

  // Function to group records by date
  const groupRecordsByDate = (records: any[]) => {
    const grouped: { [key: string]: any[] } = {}
    records.forEach((record) => {
      const recordDate = new Date(record.timestamp || record.entryTime) // Use timestamp or entryTime for grouping
      const dateKey = recordDate.toLocaleDateString("mn-MN", { year: "numeric", month: "numeric", day: "numeric" }) // Format as YYYY.MM.DD
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(record)
    })
    return grouped
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        await loadUserProfile(user.uid)
      } else {
        setLoading(false)
      }
    })
    return unsubscribe
  }, [])

  const loadUserProfile = async (userId: string) => {
    const profileRef = ref(database, `users/${userId}`)
    onValue(profileRef, (snapshot) => {
      const data = snapshot.val()
      if (data && (data.role === "manager" || data.role === "director")) {
        setUserProfile(data)
        setProfileData({
          name: data.name || "",
          phone: data.phone || "",
          email: data.email || "",
          profileImage: data.profileImage || "",
        })
        setLoading(false)
      } else {
        // Хэрэв manager эсвэл director биш бол буцаах
        setUserProfile(null)
        setLoading(false)
      }
    })
    // Load report records after profile is loaded
    setTimeout(() => {
      loadReportRecords()
    }, 500)
    // Add this line after loadReportRecords() call:
    loadEmployees()
    loadManagers()
    loadDirectors() // Add this line to load directors
    loadDrivers()
    loadDashboardData()
    loadLoginEmployees() // Add this line
    // In the loadUserProfile function, after the existing load calls around line 200, add:
    loadAvailableEmployees()
  }

  // Load directors from database
  const loadDirectors = () => {
    const usersRef = ref(database, "users")
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const directorsList: UserProfile[] = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .filter((user) => user.role === "director")
          .sort((a, b) => a.name.localeCompare(b.name))
        setDirectors(directorsList)
      } else {
        setDirectors([])
      }
    })
  }

  // Load drivers from database
  const loadDrivers = () => {
    const usersRef = ref(database, "users")
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const driversList: UserProfile[] = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .filter((user) => user.role === "driver")
          .sort((a, b) => a.name.localeCompare(b.name))
        setDrivers(driversList)
      } else {
        setDrivers([])
      }
    })
  }

  // Enhanced dashboard data loading with better analytics
  const loadDashboardData = (startDate?: string, endDate?: string) => {
    setDashboardLoading(true)
    const recordsRef = ref(database, "parking_records")
    onValue(recordsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        let records = Object.keys(data).map((key) => ({ id: key, ...data[key] }))
        // Filter by custom date range if provided
        if (startDate && endDate) {
          const start = new Date(startDate)
          const end = new Date(endDate)
          end.setHours(23, 59, 59, 999) // Include the entire end date
          records = records.filter((record) => {
            const recordDate = new Date(record.timestamp)
            return recordDate >= start && recordDate <= end
          })
        }
        // Calculate enhanced statistics
        const completedRecords = records.filter(
          (record) => record.type === "completed" || record.type === "exit" || record.exitTime,
        )
        const activeRecords = records.filter((record) => record.type === "entry" && !record.exitTime)
        // Today's statistics
        const today = new Date()
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
        const todayRecords = completedRecords.filter((record) => {
          const recordDate = new Date(record.timestamp)
          return recordDate >= todayStart && recordDate < todayEnd
        })
        const totalRevenue = completedRecords.reduce((sum, record) => sum + (record.amount || 0), 0)
        const todayRevenue = todayRecords.reduce((sum, record) => sum + (record.amount || 0), 0)
        // Calculate average session time (in hours)
        const avgSessionTime =
          completedRecords.length > 0
            ? completedRecords.reduce((sum, record) => {
                if (record.parkingDuration) {
                  // Assuming parkingDuration is in hours format like "2 цаг"
                  const duration = Number.parseFloat(record.parkingDuration.toString().replace(/[^\d.]/g, "")) || 0
                  return sum + duration
                }
                return sum
              }, 0) / completedRecords.length
            : 0
        const avgRevenue = completedRecords.length > 0 ? totalRevenue / completedRecords.length : 0
        setDashboardStats({
          totalCustomers: completedRecords.length,
          totalRevenue: totalRevenue,
          activeRecords: activeRecords.length,
          todayCustomers: todayRecords.length,
          todayRevenue: todayRevenue,
          averageSessionTime: avgSessionTime,
          averageRevenue: avgRevenue,
        })
        // Generate monthly statistics
        const monthlyStatsData = []
        const now = new Date()
        if (startDate && endDate) {
          // Custom date range logic
          const start = new Date(startDate)
          const end = new Date(endDate)
          const diffTime = Math.abs(end.getTime() - start.getTime())
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          if (diffDays <= 31) {
            // Show daily data for ranges 31 days or less
            for (let i = 0; i <= diffDays; i++) {
              const currentDate = new Date(start)
              currentDate.setDate(start.getDate() + i)
              const dayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
              const dayEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1)
              const dayRecords = completedRecords.filter((record) => {
                const recordDate = new Date(record.timestamp)
                return recordDate >= dayStart && recordDate < dayEnd
              })
              const dayRevenue = dayRecords.reduce((sum, record) => sum + (record.amount || 0), 0)
              monthlyStatsData.push({
                period: currentDate.toLocaleDateString("mn-MN", { month: "short", day: "numeric" }),
                customers: dayRecords.length,
                revenue: dayRevenue,
                date: currentDate.toISOString().split("T")[0],
              })
            }
          } else {
            // Show monthly data for longer ranges
            const startMonth = new Date(start.getFullYear(), start.getMonth(), 1)
            const endMonth = new Date(end.getFullYear(), end.getMonth(), 1)
            const currentMonth = new Date(startMonth)
            while (currentMonth <= endMonth) {
              const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
              const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
              const monthRecords = completedRecords.filter((record) => {
                const recordDate = new Date(record.timestamp)
                return recordDate >= monthStart && recordDate <= monthEnd
              })
              const monthRevenue = monthRecords.reduce((sum, record) => sum + (record.amount || 0), 0)
              monthlyStatsData.push({
                period: currentMonth.toLocaleDateString("mn-MN", { year: "numeric", month: "short" }),
                customers: monthRecords.length,
                revenue: monthRevenue,
                date: currentMonth.toISOString().split("T")[0],
              })
              currentMonth.setMonth(currentMonth.getMonth() + 1)
            }
          }
        } else {
          // Default: Show last 6 months
          for (let i = 5; i >= 0; i--) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
            const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
            const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
            const monthRecords = completedRecords.filter((record) => {
              const recordDate = new Date(record.timestamp)
              return recordDate >= monthStart && recordDate <= monthEnd
            })
            const monthRevenue = monthRecords.reduce((sum, record) => sum + (record.amount || 0), 0)
            monthlyStatsData.push({
              period: monthDate.toLocaleDateString("mn-MN", { year: "numeric", month: "short" }),
              customers: monthRecords.length,
              revenue: monthRevenue,
              date: monthDate.toISOString().split("T")[0],
            })
          }
        }
        setMonthlyStats(monthlyStatsData)
        // Generate last 7 days statistics for daily chart
        const dailyStatsData = []
        for (let i = 6; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
          const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
          const dayRecords = completedRecords.filter((record) => {
            const recordDate = new Date(record.timestamp)
            return recordDate >= dayStart && recordDate < dayEnd
          })
          const dayRevenue = dayRecords.reduce((sum, record) => sum + (record.amount || 0), 0)
          dailyStatsData.push({
            day: date.toLocaleDateString("mn-MN", { weekday: "short" }),
            date: date.toLocaleDateString("mn-MN", { month: "numeric", day: "numeric" }),
            customers: dayRecords.length,
            revenue: dayRevenue,
          })
        }
        setDailyStats(dailyStatsData)
        // Get recent activity (last 10 records from filtered data)
        const sortedRecords = records
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10)
        setRecentActivity(sortedRecords)
      }
      setDashboardLoading(false)
    })
  }

  // Apply custom date range
  const applyCustomDateRange = () => {
    if (!customDateRange.startDate || !customDateRange.endDate) {
      alert("Эхлэх болон дуусах огноог оруулна уу")
      return
    }
    const startDate = new Date(customDateRange.startDate)
    const endDate = new Date(customDateRange.endDate)
    if (startDate > endDate) {
      alert("Эхлэх огноо дуусах огнооноос өмнө байх ёстой")
      return
    }
    setCustomDateRange({ ...customDateRange, useCustomRange: true })
    loadDashboardData(customDateRange.startDate, customDateRange.endDate)
    setShowDateRangePicker(false)
  }

  // Reset to default (last 6 months)
  const resetToDefaultRange = () => {
    setCustomDateRange({
      startDate: "",
      endDate: "",
      useCustomRange: false,
    })
    loadDashboardData()
    setShowDateRangePicker(false)
  }

  // Load employees from users table where role is 'employee'
  const loadEmployees = () => {
    // Load from employees node
    const employeesRef = ref(database, "employees")
    onValue(employeesRef, (snapshot) => {
      const employeesData = snapshot.val()
      // Also load from users node where role is 'employee'
      const usersRef = ref(database, "users")
      onValue(usersRef, (usersSnapshot) => {
        const usersData = usersSnapshot.val()
        let employeesList: UserProfile[] = []
        // Combine data from both sources
        if (employeesData) {
          Object.keys(employeesData).forEach((key) => {
            employeesList.push({ id: key, ...employeesData[key] })
          })
        }
        if (usersData) {
          Object.keys(usersData).forEach((key) => {
            const user = usersData[key]
            if (user.role === "employee" && !employeesList.find((emp) => emp.id === key)) {
              employeesList.push({ id: key, ...user })
            }
          })
        }
        // Sort by name and remove duplicates
        employeesList = employeesList
          .filter((employee, index, self) => index === self.findIndex((e) => e.name === employee.name))
          .sort((a, b) => a.name.localeCompare(b.name))
        setEmployees(employeesList)
      })
    })
  }

  // Load employees with login access (role = 'employee' from users table)
  const loadLoginEmployees = () => {
    const usersRef = ref(database, "users")
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const loginEmployeesList: UserProfile[] = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .filter((user) => user.role === "employee")
          .sort((a, b) => a.name.localeCompare(b.name))
        setLoginEmployees(loginEmployeesList)
      } else {
        setLoginEmployees([])
      }
    })
  }

  // Load managers from database
  const loadManagers = () => {
    const usersRef = ref(database, "users")
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const managersList: UserProfile[] = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .filter((user) => user.role === "manager")
          .sort((a, b) => a.name.localeCompare(b.name))
        setManagers(managersList)
      } else {
        setManagers([])
      }
    })
  }

  // Add this function after the loadManagers function, around line 300
  const loadAvailableEmployees = () => {
    const employeesRef = ref(database, "employees")
    onValue(employeesRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const employeesList = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .sort((a, b) => a.name.localeCompare(b.name))
        setAvailableEmployees(employeesList)
      } else {
        setAvailableEmployees([])
      }
    })
  }

  // Handle driver operations
  const handleDeleteDriver = async (driverId: string, driverName: string) => {
    if (!confirm(`${driverName} бүртгэлийг устгахдаа итгэлтэй байна уу?`)) {
      return
    }
    try {
      await remove(ref(database, `users/${driverId}`))
      alert("Бүртгэл амжилттай устгагдлаа")
    } catch (error) {
      alert("Бүртгэл устгахад алдаа гарлаа")
    }
  }

  // In handleEditDriver function:
  const handleEditDriver = (driver: UserProfile) => {
    setEditingUser(driver)
    setEditUserData({
      name: driver.name,
      phone: driver.phone,
      email: driver.email,
      newPassword: "", // Ensure new password field is always empty on open
    })
    setShowEditDialog(true)
  }

  const handleToggleDriverStatus = async (driverId: string, currentStatus: boolean, driverName: string) => {
    const newStatus = !currentStatus
    const statusText = newStatus ? "идэвхжүүлэх" : "идэвхгүй болгох"
    if (!confirm(`${driverName} бүртгэлийг ${statusText}даа итгэлтэй байна уу?`)) {
      return
    }
    try {
      await update(ref(database, `users/${driverId}`), {
        active: newStatus,
        updatedAt: new Date().toISOString(),
      })
      alert(`Бүртгэл амжилттай ${newStatus ? "идэвхжлээ" : "идэвхгүй боллоо"}`)
    } catch (error) {
      alert("Бүргэлийн төлөв өөрчлөхөд алдаа гарлаа")
    }
  }

  // Handle employee image upload
  const handleEmployeeImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert("Зургийн хэмжээ 5MB-аас бага байх ёстой")
        return
      }
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64String = event.target?.result as string
        setNewEmployee({ ...newEmployee, profileImage: base64String })
      }
      reader.readAsDataURL(file)
    }
  }

  // Add employee
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmployee.name.trim()) {
      alert("Ажилчны нэрийг оруулна уу")
      return
    }
    setEmployeeLoading(true)
    try {
      // Create employee data for employees node
      const employeeData = {
        name: newEmployee.name.trim(),
        position: newEmployee.position.trim(),
        phone: newEmployee.phone.trim(),
        startDate: newEmployee.startDate,
        profileImage: newEmployee.profileImage || "",
        createdAt: new Date().toISOString(),
        createdBy: userProfile?.name || "Manager",
        active: true,
        email: `${newEmployee.name.toLowerCase().replace(/\s+/g, "")}@company.com`, // Generate email if not provided
      }
      // Save to employees node
      const employeeRef = await push(ref(database, "employees"), employeeData)
      // Also save to users node with employee role for authentication
      if (employeeRef.key) {
        const userData = {
          ...employeeData,
          role: "employee",
          id: employeeRef.key,
          updatedAt: new Date().toISOString(),
        }
        await set(ref(database, `users/${employeeRef.key}`), userData)
      }
      alert("Ажилчин амжилттай нэмэгдлээ")
      // Reset form
      setNewEmployee({
        name: "",
        position: "",
        phone: "",
        startDate: "",
        profileImage: "",
      })
    } catch (error) {
      console.error("Error adding employee:", error)
      alert("Ажилчин нэмэхэд алдаа гарлаа")
    }
    setEmployeeLoading(false)
  }

  // In handleEditEmployee function:
  const handleEditEmployee = (employee: UserProfile) => {
    setEditingUser(employee) // Corrected: set editingUser instead of editingDriver
    setEditUserData({
      name: employee.name,
      phone: employee.phone,
      email: employee.email,
      newPassword: "", // Ensure new password field is always empty on open
    })
    setShowEditDialog(true)
  }

  // In handleSaveEmployeeEdit function:
  const handleSaveUserEdit = async () => {
    console.log("handleSaveUserEdit called")
    if (!editingUser || !editUserData.name.trim() || !editUserData.email.trim()) {
      alert("Нэр болон и-мэйл хаягийг бөглөнө үү")
      console.error("Validation failed: Missing user data or required fields.")
      return
    }
    setEditLoading(true)
    try {
      // Merge existing user data with updated fields
      const updateData: Partial<UserProfile> = {
        ...editingUser, // Start with existing data to preserve fields not in the form
        name: editUserData.name.trim(),
        phone: editUserData.phone.trim(),
        email: editUserData.email.trim(),
        updatedAt: new Date().toISOString(),
      }

      // Ensure 'id' is not part of the update payload, as it's the key
      delete updateData.id

      console.log("Updating user with ID:", editingUser.id, "with data:", updateData)
      // Update both users and employees nodes for employees
      await update(ref(database, `users/${editingUser.id}`), updateData)
      console.log("User node updated successfully.")

      if (editingUser.role === "employee") {
        console.log("Updating employee node with ID:", editingUser.id, "with data:", updateData)
        await update(ref(database, `employees/${editingUser.id}`), updateData)
        console.log("Employee node updated successfully.")
      }

      const userType =
        editingUser.role === "manager"
          ? "Менежерийн"
          : editingUser.role === "driver"
            ? "Бүртгэлийн"
            : editingUser.role === "director"
              ? "Захиралын"
              : "Ажилчны"
      alert(`${userType} мэдээлэл амжилттай шинэчлэгдлээ`)
      setShowEditDialog(false)
      setEditingUser(null)
    } catch (error) {
      console.error("Error updating user/employee:", error)
      const userType =
        editingUser?.role === "manager"
          ? "менежерийн"
          : editingUser?.role === "driver"
            ? "бүртгэлийн"
            : editingUser?.role === "director"
              ? "захиралын"
              : "ажилчны"
      alert(`${userType} мэдээлэл шинэчлэхэд алдаа гарлаа`)
    }
    setEditLoading(false)
  }

  // Delete employee
  const handleDeleteEmployee = async (employeeId: string, employeeName: string) => {
    if (!confirm(`${employeeName} ажилчныг устгахдаа итгэлтэй байна уу?`)) {
      return
    }
    try {
      // Delete from both users and employees nodes
      await remove(ref(database, `users/${employeeId}`))
      await remove(ref(database, `employees/${employeeId}`)) // Also delete from employees node
      alert("Ажилчин амжилттай устгагдлаа")
    } catch (error) {
      console.error("Error deleting employee:", error)
      alert("Ажилчин устгахад алдаа гарлаа")
    }
  }

  // Toggle employee status
  const handleToggleEmployeeStatus = async (employeeId: string, currentStatus: boolean, employeeName: string) => {
    const newStatus = !currentStatus
    const statusText = newStatus ? "идэвхжүүлэх" : "идэвхгүй болгох"
    if (!confirm(`${employeeName} ажилчныг ${statusText}даа итгэлтэй байна уу?`)) {
      return
    }
    try {
      // Update status in both users and employees nodes
      await update(ref(database, `users/${employeeId}`), {
        active: newStatus,
        updatedAt: new Date().toISOString(),
      })
      await update(ref(database, `employees/${employeeId}`), {
        // Also update the employees node
        active: newStatus,
        updatedAt: new Date().toISOString(),
      })
      alert(`Ажилчин амжилттай ${newStatus ? "идэвхжлээ" : "идэвхгүй боллоо"}`)
    } catch (error) {
      console.error("Error toggling employee status:", error)
      alert("Ажилчны төлөв өөрчлөхөд алдаа гарлаа")
    }
  }

  // Handle manager operations
  const handleDeleteManager = async (managerId: string, managerName: string) => {
    if (!confirm(`${managerName} менежерийг устгахдаа итгэлтэй байна уу?`)) {
      return
    }
    try {
      await remove(ref(database, `users/${managerId}`))
      alert("Менежер амжилттай устгагдлаа")
    } catch (error) {
      alert("Менежер устгахад алдаа гарлаа")
    }
  }

  const handleEditManager = (manager: UserProfile) => {
    setEditingUser(manager)
    setEditUserData({
      name: manager.name,
      phone: manager.phone,
      email: manager.email,
      newPassword: "",
    })
    setShowEditDialog(true)
  }

  const handleToggleManagerStatus = async (managerId: string, currentStatus: boolean, managerName: string) => {
    const newStatus = !currentStatus
    const statusText = newStatus ? "идэвхжүүлэх" : "идэвхгүй болгох"
    if (!confirm(`${managerName} менежерийг ${statusText}даа итгэлтэй байна уу?`)) {
      return
    }
    try {
      await update(ref(database, `users/${managerId}`), {
        active: newStatus,
        updatedAt: new Date().toISOString(),
      })
      alert(`Менежер амжилттай ${newStatus ? "идэвхжлээ" : "идэвхгүй боллоо"}`)
    } catch (error) {
      alert("Менежерийн төлөв өөрчлөхөд алдаа гарлаа")
    }
  }

  // Handle director operations
  const handleDeleteDirector = async (directorId: string, directorName: string) => {
    if (!confirm(`${directorName} захиралыг устгахдаа итгэлтэй байна уу?`)) {
      return
    }
    try {
      await remove(ref(database, `users/${directorId}`))
      alert("Захирал амжилттай устгагдлаа")
    } catch (error) {
      alert("Захирал устгахад алдаа гарлаа")
    }
  }

  const handleEditDirector = (director: UserProfile) => {
    setEditingUser(director)
    setEditUserData({
      name: director.name,
      phone: director.phone,
      email: director.email,
      newPassword: "",
    })
    setShowEditDialog(true)
  }

  const handleToggleDirectorStatus = async (directorId: string, currentStatus: boolean, directorName: string) => {
    const newStatus = !currentStatus
    const statusText = newStatus ? "идэвхжүүлэх" : "идэвхгүй болгох"
    if (!confirm(`${directorName} захиралыг ${statusText}даа итгэлтэй байна уу?`)) {
      return
    }
    try {
      await update(ref(database, `users/${directorId}`), {
        active: newStatus,
        updatedAt: new Date().toISOString(),
      })
      alert(`Захирал амжилттай ${newStatus ? "идэвхжлээ" : "идэвхгүй боллоо"}`)
    } catch (error) {
      alert("Захиралын төлөв өөрчлөхөд алдаа гарлаа")
    }
  }

  const loadReportRecords = () => {
    setReportLoading(true)
    const recordsRef = ref(database, "parking_records")
    onValue(recordsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const records = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        setReportRecords(records)
        setFilteredReportRecords(records)
      } else {
        setReportRecords([])
        setFilteredReportRecords([])
      }
      setReportLoading(false)
    })
  }

  const calculateParkingFee = (entryTime: string, exitTime: string): number => {
    if (!entryTime || !exitTime) {
      return 0
    }
    try {
      // Parse the Mongolian formatted dates
      const parseMongoDate = (dateStr: string) => {
        // Format: "2024.01.15, 14:30" or similar
        const cleanStr = dateStr.replace(/[^\d\s:.,]/g, "")
        const parts = cleanStr.split(/[,\s]+/)
        if (parts.length >= 2) {
          const datePart = parts[0] // "2024.01.15"
          const timePart = parts[1] // "14:30"
          const [year, month, day] = datePart.split(".").map(Number)
          const [hour, minute] = timePart.split(":").map(Number)
          return new Date(year, month - 1, day, hour, minute)
        }
        // Fallback to direct parsing
        return new Date(dateStr)
      }
      const entryDate = parseMongoDate(entryTime)
      const exitDate = parseMongoDate(exitTime)
      if (isNaN(entryDate.getTime()) || isNaN(exitDate.getTime())) {
        return 0
      }
      const diffInMs = exitDate.getTime() - entryDate.getTime()
      const diffInMinutes = Math.ceil(diffInMs / (1000 * 60)) // Round up to next minute
      return Math.max(0, diffInMinutes * 0) // Assuming a default rate if pricing config is removed
    } catch (error) {
      console.error("Error calculating parking fee:", error)
      return 0
    }
  }

  const calculateParkingFeeForReport = (record: any): number => {
    // If individual payment amounts are stored, sum them up
    if (record.cashAmount !== undefined || record.cardAmount !== undefined || record.transferAmount !== undefined) {
      return (record.cashAmount || 0) + (record.cardAmount || 0) + (record.transferAmount || 0)
    }
    // Fallback to old logic if individual amounts are not present
    if (record.type === "exit" && record.entryTime) {
      return calculateParkingFee(record.entryTime, record.exitTime || "")
    }
    return record.amount || 0
  }

  // Filter records by date range
  const getDateRangeFilteredRecords = () => {
    if (!dateRangeStart || !dateRangeEnd) {
      return filteredReportRecords
    }
    const startDate = new Date(dateRangeStart)
    const endDate = new Date(dateRangeEnd)
    endDate.setHours(23, 59, 59, 999) // Include the entire end date
    return filteredReportRecords.filter((record) => {
      const recordDate = new Date(record.timestamp)
      return recordDate >= startDate && recordDate <= endDate
    })
  }

  // Image viewer functions
  const openImageViewer = (images: string[], startIndex = 0) => {
    setCurrentImages(images)
    setCurrentImageIndex(startIndex)
    setShowImageViewer(true)
  }

  const closeImageViewer = () => {
    setShowImageViewer(false)
    setCurrentImages([])
    setCurrentImageIndex(0)
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % currentImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + currentImages.length) % currentImages.length)
  }

  // Handle keyboard navigation for image viewer
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showImageViewer) {
        switch (event.key) {
          case "Escape":
            closeImageViewer()
            break
          case "ArrowLeft":
            prevImage()
            break
          case "ArrowRight":
            nextImage()
            break
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [showImageViewer, currentImages.length])

  const exportToExcel = () => {
    try {
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new()
      // Prepare data for Excel
      const excelData = filteredReportRecords.map((record, index) => ({
        "№": index + 1,
        "Машины дугаар": record.carNumber,
        Засварчин: record.mechanicName || record.driverName || "-",
        "Үйлчилгээ": (() => {
          const employee = employees.find((emp) => emp.name === (record.mechanicName || record.driverName))
          return employee?.position || "-"
        })(),
        Талбай: getAreaNameInMongolian(record.parkingArea || record.carBrand),
        "Машины марк": record.carBrand || "-",
        "Орсон цаг": record.entryTime || "-",
        "Гарсан цаг": record.exitTime || "-",
        "Зогссон хугацаа": record.parkingDuration ? `${record.parkingDuration} ц` : "-",
        "Төлбөр (₮)": calculateParkingFeeForReport(record),
        "Бэлэн мөнгө (₮)": record.cashAmount || 0, // Added cash amount
        "Карт (₮)": record.cardAmount || 0, // Added card amount
        "Харилцах (₮)": record.transferAmount || 0, // Added transfer amount
        "Төлбөрийн төлөв": record.paymentStatus === "paid" ? "Төлсөн" : "Төлөөгүй",
        Зураг: record.images && record.images.length > 0 ? "Байна" : "Байхгүй",
      }))
      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(excelData)
      // Set column widths
      const colWidths = [
        { wch: 5 }, // №
        { wch: 15 }, // Машины дугаар
        { wch: 20 }, // Засварчин
        { wch: 15 }, // Үйлчилгээ
        { wch: 15 }, // Талбай
        { wch: 15 }, // Машины марк (NEW)
        { wch: 20 }, // Орсон цаг
        { wch: 20 }, // Гарсан цаг
        { wch: 15 }, // Зогссон хугацаа
        { wch: 12 }, // Төлбөр
        { wch: 15 }, // Бэлэн мөнгө
        { wch: 12 }, // Карт
        { wch: 15 }, // Харилцах
        { wch: 15 }, // Төлбөрийн төлөв
        { wch: 10 }, // Зураг
      ]
      ws["!cols"] = colWidths
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Зогсоолын тайлан")
      // Add summary rows
      const summaryData = [
        {
          "№": "",
          "Машины дугаар": "",
          Засварчин: "",
          "Үйлчилгээ": "",
          Талбай: "",
          "Машины марк": "",
          "Орсон цаг": "",
          "Гарсан цаг": "",
          "Зогссон хугацаа": "Нийт Бэлэн мөнгө:",
          "Төлбөр (₮)": totalCashAmount,
          "Бэлэн мөнгө (₮)": "",
          "Карт (₮)": "",
          "Харилцах (₮)": "",
          "Төлбөрийн төлөв": "",
          Зураг: "",
        },
        {
          "№": "",
          "Машины дугаар": "",
          Засварчин: "",
          "Үйлчилгээ": "",
          Талбай: "",
          "Машины марк": "",
          "Орсон цаг": "",
          "Гарсан цаг": "",
          "Зогссон хугацаа": "Нийт Карт:",
          "Төлбөр (₮)": totalCardAmount,
          "Бэлэн мөнгө (₮)": "",
          "Карт (₮)": "",
          "Харилцах (₮)": "",
          "Төлбөрийн төлөв": "",
          Зураг: "",
        },
        {
          "№": "",
          "Машины дугаар": "",
          Засварчин: "",
          "Үйлчилгээ": "",
          Талбай: "",
          "Машины марк": "",
          "Орсон цаг": "",
          "Гарсан цаг": "",
          "Зогссон хугацаа": "Нийт Харилцах:",
          "Төлбөр (₮)": totalTransferAmount,
          "Бэлэн мөнгө (₮)": "",
          "Карт (₮)": "",
          "Харилцах (₮)": "",
          "Төлбөрийн төлөв": "",
          Зураг: "",
        },
        {
          "№": "",
          "Машины дугаар": "",
          Засварчин: "",
          "Үйлчилгээ": "",
          Талбай: "",
          "Машины марк": "",
          "Орсон цаг": "",
          "Гарсан цаг": "",
          "Зогссон хугацаа": "Нийт дүн:",
          "Төлбөр (₮)": totalCashAmount + totalCardAmount + totalTransferAmount,
          "Бэлэн мөнгө (₮)": "",
          "Карт (₮)": "",
          "Харилцах (₮)": "",
          "Төлбөрийн төлөв": "",
          Зураг: "",
        },
      ]
      XLSX.utils.sheet_add_json(ws, summaryData, { skipHeader: true, origin: -1 })
      // Generate filename with current date
      const currentDate = new Date().toISOString().split("T")[0]
      const filename = `Зогсоолын_тайлан_${currentDate}.xlsx`
      // Create blob and download file (browser-compatible way)
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const blob = new Blob([wbout], { type: "application/octet-stream" })
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      alert("Excel файл амжилттай татагдлаа!")
    } catch (error) {
      console.error("Excel export error:", error)
      alert("Excel файл татахад алдаа гарлаа")
    }
  }

  // Export with date range and optional deletion
  const handleDateRangeExport = async () => {
    if (!dateRangeStart || !dateRangeEnd) {
      alert("Эхлэх болон дуусах огноог оруулна уу")
      return
    }
    const startDate = new Date(dateRangeStart)
    const endDate = new Date(dateRangeEnd)
    if (startDate > endDate) {
      alert("Эхлэх огноо дуусах огнооноос өмнө байх ёстой")
      return
    }
    setExportLoading(true)
    try {
      const recordsToExport = getDateRangeFilteredRecords()
      if (recordsToExport.length === 0) {
        alert("Тухайн хугацаанд бүртгэл олдсонгүй")
        setExportLoading(false)
        return
      }
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new()
      // Prepare data for Excel
      const excelData = recordsToExport.map((record, index) => ({
        "№": index + 1,
        "Машины дугаар": record.carNumber,
        Засварчин: record.mechanicName || record.driverName || "-",
        "Үйлчилгээ": (() => {
          const employee = employees.find((emp) => emp.name === (record.mechanicName || record.driverName))
          return employee?.position || "-"
        })(),
        Талбай: getAreaNameInMongolian(record.parkingArea || record.carBrand),
        "Машины марк": record.carBrand || "-",
        "Орсон цаг": record.entryTime || "-",
        "Гарсан цаг": record.exitTime || "-",
        "Зогссон хугацаа": record.parkingDuration ? `${record.parkingDuration} ц` : "-",
        "Төлбөр (₮)": calculateParkingFeeForReport(record),
        "Бэлэн мөнгө (₮)": record.cashAmount || 0, // Added cash amount
        "Карт (₮)": record.cardAmount || 0, // Added card amount
        "Харилцах (₮)": record.transferAmount || 0, // Added transfer amount
        "Төлбөрийн төлөв": record.paymentStatus === "paid" ? "Төлсөн" : "Төлөөгүй",
        Зураг: record.images && record.images.length > 0 ? "Байна" : "Байхгүй",
      }))
      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(excelData)
      // Set column widths
      const colWidths = [
        { wch: 5 }, // №
        { wch: 15 }, // Машины дугаар
        { wch: 20 }, // Засварчин
        { wch: 15 }, // Үйлчилгээ
        { wch: 15 }, // Талбай
        { wch: 15 }, // Машины марк (NEW)
        { wch: 20 }, // Орсон цаг
        { wch: 20 }, // Гарсан цаг
        { wch: 15 }, // Зогссон хугацаа
        { wch: 12 }, // Төлбөр
        { wch: 15 }, // Бэлэн мөнгө
        { wch: 12 }, // Карт
        { wch: 15 }, // Харилцах
        { wch: 15 }, // Төлбөрийн төлөв
        { wch: 10 }, // Зураг
      ]
      ws["!cols"] = colWidths
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Зогсоолын тайлан")
      // Calculate sums for the exported records
      let exportCashSum = 0
      let exportCardSum = 0
      let exportTransferSum = 0
      recordsToExport.forEach((record) => {
        if (record.paymentStatus === "paid") {
          exportCashSum += record.cashAmount || 0
          exportCardSum += record.cardAmount || 0
          exportTransferSum += record.transferAmount || 0
        }
      })

      // Add summary rows
      const summaryData = [
        {
          "№": "",
          "Машины дугаар": "",
          Засварчин: "",
          "Үйлчилгээ": "",
          Талбай: "",
          "Машины марк": "",
          "Орсон цаг": "",
          "Гарсан цаг": "",
          "Зогссон хугацаа": "Нийт Бэлэн мөнгө:",
          "Төлбөр (₮)": exportCashSum,
          "Бэлэн мөнгө (₮)": "",
          "Карт (₮)": "",
          "Харилцах (₮)": "",
          "Төлбөрийн төлөв": "",
          Зураг: "",
        },
        {
          "№": "",
          "Машины дугаар": "",
          Засварчин: "",
          "Үйлчилгээ": "",
          Талбай: "",
          "Машины марк": "",
          "Орсон цаг": "",
          "Гарсан цаг": "",
          "Зогссон хугацаа": "Нийт Карт:",
          "Төлбөр (₮)": exportCardSum,
          "Бэлэн мөнгө (₮)": "",
          "Карт (₮)": "",
          "Харилцах (₮)": "",
          "Төлбөрийн төлөв": "",
          Зураг: "",
        },
        {
          "№": "",
          "Машины дугаар": "",
          Засварчин: "",
          "Үйлчилгээ": "",
          Талбай: "",
          "Машины марк": "",
          "Орсон цаг": "",
          "Гарсан цаг": "",
          "Зогссон хугацаа": "Нийт Харилцах:",
          "Төлбөр (₮)": exportTransferSum,
          "Бэлэн мөнгө (₮)": "",
          "Карт (₮)": "",
          "Харилцах (₮)": "",
          "Төлбөрийн төлөв": "",
          Зураг: "",
        },
        {
          "№": "",
          "Машины дугаар": "",
          Засварчин: "",
          "Үйлчилгээ": "",
          Талбай: "",
          "Машины марк": "",
          "Орсон цаг": "",
          "Гарсан цаг": "",
          "Зогссон хугацаа": "Нийт дүн:",
          "Төлбөр (₮)": exportCashSum + exportCardSum + exportTransferSum,
          "Бэлэн мөнгө (₮)": "",
          "Карт (₮)": "",
          "Харилцах (₮)": "",
          "Төлбөрийн төлөв": "",
          Зураг: "",
        },
      ]
      XLSX.utils.sheet_add_json(ws, summaryData, { skipHeader: true, origin: -1 })
      // Generate filename with date range
      const startDateStr = dateRangeStart.replace(/-/g, ".")
      const endDateStr = dateRangeEnd.replace(/-/g, ".")
      const filename = `Зогсоолын_тайлан_${startDateStr}_${endDateStr}.xlsx`
      // Create blob and download file (browser-compatible way)
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const blob = new Blob([wbout], { type: "application/octet-stream" })
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      // Delete records if option is selected
      if (deleteAfterExport) {
        const deletePromises = recordsToExport.map((record) => remove(ref(database, `parking_records/${record.id}`)))
        await Promise.all(deletePromises)
        alert(`Excel файл амжилттай татагдлаа! ${recordsToExport.length} бүртгэл өгөгдлийн сангаас устгагдлаа.`)
      } else {
        alert(`Excel файл амжилттай татагдлаа! ${recordsToExport.length} бүртгэл татагдлаа.`)
      }
      // Reset form
      setDateRangeStart("")
      setDateRangeEnd("")
      setDeleteAfterExport(false)
      setShowDateRangeDialog(false)
    } catch (error) {
      console.error("Date range export error:", error)
      alert("Excel файл татахад алдаа гарлаа")
    }
    setExportLoading(false)
  }

  // Get unique mechanic names for filter
  const getAvailableMechanicNames = () => {
    const names = reportRecords.map((record) => record.mechanicName || record.driverName)
    return [...new Set(names)].filter((name) => name).sort()
  }

  // Filter report records - Updated to use day and time filters instead of year and month
  useEffect(() => {
    let filtered = [...reportRecords]

    // Filter by day
    if (reportFilterDay) {
      filtered = filtered.filter((record) => {
        const recordDate = new Date(record.timestamp)
        const recordDay = recordDate.toISOString().split("T")[0] // YYYY-MM-DD format
        return recordDay === reportFilterDay
      })
    }

    // Filter by time (hour)
    if (reportFilterTime) {
      filtered = filtered.filter((record) => {
        const recordDate = new Date(record.timestamp)
        const recordHour = recordDate.getHours().toString().padStart(2, "0")
        return recordHour === reportFilterTime
      })
    }

    if (reportFilterCarNumber) {
      filtered = filtered.filter((record) =>
        record.carNumber.toLowerCase().includes(reportFilterCarNumber.toLowerCase()),
      )
    }
    if (reportFilterMechanic.length > 0) {
      // Check if any mechanics are selected
      filtered = filtered.filter((record) => {
        const mechanicName = record.mechanicName || record.driverName || ""
        return reportFilterMechanic.includes(mechanicName) // Check if mechanicName is in the selected array
      })
    }
    // Add payment status filter
    if (reportFilterPaymentStatus) {
      filtered = filtered.filter((record) => {
        if (reportFilterPaymentStatus === "paid") {
          return record.paymentStatus === "paid"
        } else if (reportFilterPaymentStatus === "unpaid") {
          return record.paymentStatus !== "paid"
        }
        return true
      })
    }
    setFilteredReportRecords(filtered)

    // Calculate total amounts for each payment method
    let cashSum = 0
    let cardSum = 0
    let transferSum = 0
    filtered.forEach((record) => {
      if (record.paymentStatus === "paid") {
        cashSum += record.cashAmount || 0
        cardSum += record.cardAmount || 0
        transferSum += record.transferAmount || 0
      }
    })
    setTotalCashAmount(cashSum)
    setTotalCardAmount(cardSum)
    setTotalTransferAmount(transferSum)
  }, [
    reportRecords,
    reportFilterDay,
    reportFilterTime,
    reportFilterCarNumber,
    reportFilterMechanic,
    reportFilterPaymentStatus,
  ])

  const handleRegisterDriver = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDriver.email || !newDriver.password || !newDriver.name) {
      alert("Бүх талбарыг бөглөнө үү")
      return
    }
    if (newDriver.password.length < 6) {
      alert("Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой")
      return
    }
    setRegistrationLoading(true)
    try {
      // Firebase Auth дээр хэрэглэгч үүсгэх
      const userCredential = await createUserWithEmailAndPassword(auth, newDriver.email, newDriver.password)
      const newUserId = userCredential.user.uid
      // Database дээр хэрэглэгчийн мэдээлэл хадгалах
      const userData: UserProfile = {
        name: newDriver.name.trim(),
        phone: newDriver.phone.trim(),
        email: newDriver.email,
        role: selectedRole, // Use selectedRole directly - it can be "manager", "driver", "employee", or "director"
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await set(ref(database, `users/${newUserId}`), userData)
      // Update the alert message to include "director"
      alert(
        `${selectedRole === "manager" ? "Менежер" : selectedRole === "driver" ? "Бүртгэл" : selectedRole === "employee" ? "Засварчин" : "Ажилчин"} амжилттай бүртгэгдлээ`,
      )
      // Form цэвэрлэх
      setNewDriver({
        email: "",
        password: "",
        name: "",
        phone: "",
        role: "driver",
        createdAt: "",
      })
    } catch (error: any) {
      console.error("Driver registration error:", error)
      if (error.code === "auth/email-already-in-use") {
        alert("Энэ и-мэйл хаяг аль хэдийн ашиглагдаж байна")
      } else if (error.code === "auth/invalid-email") {
        alert("И-мэйл хаяг буруу байна")
      } else {
        alert("Бүртгэхэд алдаа гарлаа")
      }
    }
    setRegistrationLoading(false)
  }

  // Add this function after the handleRegisterDriver function, around line 1000
  const handleEmployeeSelection = (employeeId: string) => {
    const selectedEmployee = availableEmployees.find((emp) => emp.id === employeeId)
    if (selectedEmployee) {
      setNewDriver({
        ...newDriver,
        name: selectedEmployee.name,
        phone: selectedEmployee.phone || "",
      })
      setIsNamePhoneAutoFilled(true)
    } else {
      // If no employee is selected (e.g., "Сонгоно уу" is chosen), clear fields and enable editing
      setNewDriver((prev) => ({ ...prev, name: "", phone: "" }))
      setIsNamePhoneAutoFilled(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "profile") => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert("Зургийн хэмжээ 5MB-аас бага байх ёстой")
        return
      }
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64String = event.target?.result as string
        if (type === "profile") {
          setProfileData({ ...profileData, profileImage: base64String })
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = async () => {
    if (!profileData.name.trim()) {
      alert("Нэрээ оруулна уу")
      return
    }
    if (!profileData.email.trim()) {
      alert("И-мэйл хаягаа оруулна уу")
      return
    }
    // Validate password if provided
    if (passwordData.newPassword) {
      if (passwordData.newPassword.length < 6) {
        alert("Нууц үг хамгийн багадаа 6 тэмдэг байх ёстой")
        return
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        alert("Нууц үг таарахгүй байна")
        return
      }
    }
    setLoadingProfile(true)
    try {
      if (user) {
        const updateData = {
          name: profileData.name.trim(),
          phone: profileData.phone.trim(),
          email: profileData.email.trim(),
          profileImage: profileData.profileImage,
          updatedAt: new Date().toISOString(),
        }
        await update(ref(database, `users/${user.uid}`), updateData)
        alert("Профайл амжилттай шинэчлэгдлээ")
        setShowProfileDialog(false)
        // Clear password fields
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Профайл шинэчлэхэд алдаа гарлаа")
    }
    setLoadingProfile(false)
  }

  const handlePaymentStatusUpdate = (record: any) => {
    setSelectedRecord(record)
    // Initialize payment amounts from existing data
    setCashAmountInput(record.cashAmount || 0)
    setCardAmountInput(record.cardAmount || 0)
    setTransferAmountInput(record.transferAmount || 0)
    setInitialAmountToPay(calculateParkingFeeForReport(record))
    setShowPaymentDialog(true)
  }

  const handleSavePaymentStatus = async () => {
    if (!selectedRecord) return
    // Validate that at least one payment amount is greater than 0
    const totalAmount = cashAmountInput + cardAmountInput + transferAmountInput
    if (totalAmount <= 0) {
      alert("Хамгийн багадаа нэг төлбөрийн хэлбэрт 0-ээс их дүн оруулна уу")
      return
    }
    setPaymentLoading(true)
    try {
      const updateData = {
        paymentStatus: "paid",
        cashAmount: cashAmountInput,
        cardAmount: cardAmountInput,
        transferAmount: transferAmountInput,
        amount: totalAmount, // Keep total amount for backward compatibility
        paymentMethod:
          cashAmountInput > 0 && cardAmountInput === 0 && transferAmountInput === 0
            ? "cash"
            : cardAmountInput > 0 && cashAmountInput === 0 && transferAmountInput === 0
              ? "card"
              : transferAmountInput > 0 && cashAmountInput === 0 && cardAmountInput === 0
                ? "mixed"
                : "mixed", // Mixed payment
        updatedAt: new Date().toISOString(),
      }
      await update(ref(database, `parking_records/${selectedRecord.id}`), updateData)
      alert("Төлбөрийн мэдээлэл амжилттай шинэчлэгдлээ")
      setShowPaymentDialog(false)
      setSelectedRecord(null)
      // Reset payment amounts
      setCashAmountInput(0)
      setCardAmountInput(0)
      setTransferAmountInput(0)
    } catch (error) {
      console.error("Error updating payment status:", error)
      alert("Төлбөрийн мэдээлэл шинэчлэхэд алдаа гарлаа")
    }
    setPaymentLoading(false)
  }

  // Edit record functions
  const handleEditRecord = (record: any) => {
    setEditingRecord(record)
    const employee = employees.find((emp) => emp.name === (record.mechanicName || record.driverName))
    setEditRecordData({
      carNumber: record.carNumber || "",
      mechanicName: record.mechanicName || record.driverName || "",
      carBrand: record.carBrand || record.parkingArea || "",
      parkingArea: record.parkingArea || "general", // Initialize parking area
      position: employee?.position || "", // Initialize position from employee data
      entryTime: record.entryTime || "",
      exitTime: record.exitTime || "",
      parkingDuration: record.parkingDuration || "",
      amount: calculateParkingFeeForReport(record), // Initialize amount
      images: record.images || [], // Initialize images
    })
    setShowEditRecordDialog(true)
  }

  const handleImageUploadForRecord = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Зургийн хэмжээ 5MB-аас бага байх ёстой")
        return
      }
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64String = event.target?.result as string
        setEditRecordData((prevData) => ({
          ...prevData,
          images: [...prevData.images, base64String],
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveRecordEdit = async () => {
    if (!editingRecord || !editRecordData.carNumber.trim()) {
      alert("Машины дугаарыг оруулна уу")
      return
    }
    setEditRecordLoading(true)
    try {
      const updateData = {
        carNumber: editRecordData.carNumber.trim(),
        mechanicName: editRecordData.mechanicName.trim(),
        driverName: editRecordData.mechanicName.trim(), // Keep both for compatibility
        carBrand: editRecordData.carBrand.trim(),
        parkingArea: editRecordData.parkingArea, // Save parking area
        entryTime: editRecordData.entryTime,
        exitTime: editRecordData.exitTime,
        parkingDuration: editRecordData.parkingDuration,
        amount: editRecordData.amount, // Save amount
        images: editRecordData.images, // Save images
        updatedAt: new Date().toISOString(),
      }
      await update(ref(database, `parking_records/${editingRecord.id}`), updateData)
      alert("Бүртгэл амжилттай шинэчлэгдлээ")
      setShowEditRecordDialog(false)
      setEditingRecord(null)
    } catch (error: any) {
      console.error("Error updating record:", error)
      alert("Бүртгэл шинэчлэхэд алдаа гарлаа")
    }
    setEditRecordLoading(false)
  }

  const handleLogout = async () => {
    if (confirm("Системээс гарахдаа итгэлтэй байна уу?")) {
      setLogoutLoading(true) // Set loading state
      try {
        await signOut(auth)
        alert("Амжилттай гарлаа")
        router.push("/login") // Redirect to login page
      } catch (error) {
        alert("Гарахад алдаа гарлаа")
      } finally {
        setLogoutLoading(false) // Reset loading state
      }
    }
  }

  const handleDeleteRecordImage = (indexToDelete: number) => {
    setEditRecordData((prevData) => ({
      ...prevData,
      images: prevData.images.filter((_, i) => i !== indexToDelete),
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-300">Ачааллаж байна...</p>
        </div>
      </div>
    )
  }

  if (!user || !userProfile || (userProfile.role !== "manager" && userProfile.role !== "director")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Card className="w-full max-w-md bg-gray-900 text-white border-gray-700">
          <CardHeader>
            <CardTitle className="text-center text-red-500">Хандах эрх хүрэлцэхгүй</CardTitle>
            <CardDescription className="text-center text-gray-400">
              Та менежер эсвэл захиралын эрхтэй байх ёстой
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full bg-transparent border-gray-700 text-white hover:bg-gray-800"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Буцах
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-black shadow-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-white">
                {userProfile.role === "director" ? "Захиралын" : "Менежерийн"} самбар
              </h1>
              <Badge variant="secondary" className="bg-blue-900 text-blue-300">
                {userProfile.role === "director" ? "Захирал" : "Менежер"}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 text-white hover:bg-gray-800">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userProfile.profileImage || "/placeholder.svg"} />
                      <AvatarFallback>
                        <UserIcon className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block">{userProfile.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-gray-900 text-white border-gray-700">
                  <DropdownMenuItem onClick={() => setShowProfileDialog(true)} className="hover:bg-gray-800">
                    <UserIcon className="w-4 h-4 mr-2" />
                    Профайл засах
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-500 hover:bg-gray-800"
                    disabled={logoutLoading}
                  >
                    {logoutLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500 mr-2"></div>
                        Гарч байна...
                      </>
                    ) : (
                      <>
                        <LogOut className="w-4 h-4 mr-2" />
                        Гарах
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-900 border border-gray-700">
            <TabsTrigger
              value="dashboard"
              className="flex items-center space-x-2 text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Хяналтын самбар</span>
            </TabsTrigger>
            <TabsTrigger
              value="employees"
              className="flex items-center space-x-2 text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
            >
              <Users className="w-4 h-4" />
              <span>Ажилчид</span>
            </TabsTrigger>
            <TabsTrigger
              value="registration"
              className="flex items-center space-x-2 text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
            >
              <UserPlus className="w-4 h-4" />
              <span>Бүртгэл</span>
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="flex items-center space-x-2 text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
            >
              <Car className="w-4 h-4" />
              <span>Тайлан</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Хяналтын самбар</h2>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDateRangePicker(true)}
                  className="flex items-center space-x-2 bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Огнооны хүрээ</span>
                </Button>
                {customDateRange.useCustomRange && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetToDefaultRange}
                    className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
                  >
                    Анхдагш
                  </Button>
                )}
              </div>
            </div>

            {/* Date Range Picker Dialog */}
            <Dialog open={showDateRangePicker} onOpenChange={setShowDateRangePicker}>
              <DialogContent className="bg-gray-900 text-white border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Огнооны хүрээ сонгох</DialogTitle>
                  <DialogDescription className="text-gray-400">Тайлангийн хугацааг сонгоно уу</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="startDate" className="text-gray-300">
                      Эхлэх огноо
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={customDateRange.startDate}
                      onChange={(e) => setCustomDateRange({ ...customDateRange, startDate: e.target.value })}
                      className="bg-gray-800 text-white border-gray-700"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate" className="text-gray-300">
                      Дуусах огноо
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={customDateRange.endDate}
                      onChange={(e) => setCustomDateRange({ ...customDateRange, endDate: e.target.value })}
                      className="bg-gray-800 text-white border-gray-700"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowDateRangePicker(false)}
                    className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
                  >
                    Цуцлах
                  </Button>
                  <Button onClick={applyCustomDateRange} className="bg-blue-600 text-white hover:bg-blue-700">
                    Хайх
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {dashboardLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-gray-900 text-white border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-300">Нийт үйлчлүүлэгч</CardTitle>
                      <Users className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardStats.totalCustomers.toLocaleString()}</div>
                      <p className="text-xs text-gray-400">Бүх цагийн</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-900 text-white border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-300">Нийт орлого</CardTitle>
                      <TrendingUp className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">₮{dashboardStats.totalRevenue.toLocaleString()}</div>
                      <p className="text-xs text-gray-400">Бүх цагийн</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-900 text-white border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-300">Идэвхтэй зогсоол</CardTitle>
                      <Car className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardStats.activeRecords}</div>
                      <p className="text-xs text-gray-400">Одоогийн байдлаар</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-900 text-white border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-300">Өнөөдрийн орлого</CardTitle>
                      <BarChart3 className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">₮{dashboardStats.todayRevenue.toLocaleString()}</div>
                      <p className="text-xs text-gray-400">{dashboardStats.todayCustomers} үйлчлүүлэгч</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Monthly/Period Stats Chart */}
                  <Card className="bg-gray-900 text-white border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">
                        {customDateRange.useCustomRange ? "Хугацааны статистик" : "Сарын статистик"}
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        {customDateRange.useCustomRange
                          ? `${customDateRange.startDate} - ${customDateRange.endDate}`
                          : "Сүүлийн 6 сар"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {monthlyStats.map((stat, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              <span className="text-sm font-medium text-gray-300">{stat.period}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold">₮{stat.revenue.toLocaleString()}</div>
                              <div className="text-xs text-gray-500">{stat.customers} үйлчлүүлэгч</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Daily Stats Chart */}
                  <Card className="bg-gray-900 text-white border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">7 хоногийн статистик</CardTitle>
                      <CardDescription className="text-gray-400">Сүүлийн долоо хоногийн үйл ажиллагаа</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {dailyStats.map((stat, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                              <span className="text-sm font-medium text-gray-300">
                                {stat.day} ({stat.date})
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold">₮{stat.revenue.toLocaleString()}</div>
                              <div className="text-xs text-gray-500">{stat.customers} үйлчлүүлэгч</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card className="bg-gray-900 text-white border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Сүүлийн үйл ажиллагаа</CardTitle>
                    <CardDescription className="text-gray-400">Сүүлийн 10 бүртгэл</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">Бүртгэл олдсонгүй</p>
                      ) : (
                        recentActivity.map((record, index) => (
                          <div key={index} className="flex items-center justify-between border-b border-gray-800 pb-2">
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  record.type === "entry"
                                    ? "bg-green-500"
                                    : record.type === "exit"
                                      ? "bg-red-500"
                                      : "bg-blue-500"
                                }`}
                              ></div>
                              <div>
                                <div className="font-medium">{record.carNumber}</div>
                                <div className="text-sm text-gray-400">
                                  {record.mechanicName || record.driverName || "Тодорхойгүй"}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold">
                                {record.type === "entry" ? "Орсон" : record.type === "exit" ? "Гарсан" : "Дууссан"}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(record.timestamp).toLocaleString("mn-MN")}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Employees Tab */}
          <TabsContent value="employees" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Ажилчдын удирдлага</h2>
              <Button
                onClick={() => setShowEmployeeDialog(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white hover:bg-blue-700"
              >
                <UserPlus className="w-4 h-4" />
                <span>Ажилчин нэмэх</span>
              </Button>
            </div>

            {/* Employee Management Tabs */}
            <Tabs defaultValue="employees" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3 bg-gray-900 border border-gray-700">
                <TabsTrigger
                  value="employees"
                  className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
                >
                  Ажилчид ({employees.length})
                </TabsTrigger>
                <TabsTrigger
                  value="managers"
                  className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
                >
                  Менежерүүд ({managers.length})
                </TabsTrigger>
                {/* Removed Directors TabTrigger */}
                <TabsTrigger
                  value="drivers"
                  className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
                >
                  Бүртгэгч ({drivers.length})
                </TabsTrigger>
              </TabsList>

              {/* Employees List */}
              <TabsContent value="employees">
                <Card className="bg-gray-900 text-white border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Ажилчдын жагсаалт</CardTitle>
                    <CardDescription className="text-gray-400">Бүх ажилчдын мэдээлэл</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {employees.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">Ажилчин олдсонгүй</p>
                    ) : (
                      <div className="space-y-4">
                        {employees.map((employee) => (
                          <div
                            key={employee.id}
                            className="flex items-center justify-between p-4 border border-gray-700 rounded-lg"
                          >
                            <div className="flex items-center space-x-4">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={employee.profileImage || "/placeholder.svg"} />
                                <AvatarFallback>
                                  <UserIcon className="h-6 w-6" />
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold text-white">{employee.name}</h3>
                                <p className="text-sm text-gray-400">{employee.position || "Ажилчин"}</p>
                                <p className="text-sm text-gray-500">{employee.phone}</p>
                                <p className="text-sm text-gray-500">{employee.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge
                                variant={employee.active !== false ? "default" : "secondary"}
                                className={
                                  employee.active !== false ? "bg-green-700 text-white" : "bg-gray-700 text-gray-300"
                                }
                              >
                                {employee.active !== false ? "Идэвхтэй" : "Идэвхгүй"}
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-gray-300 hover:bg-gray-800">
                                    <Settings className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-gray-900 text-white border-gray-700">
                                  <DropdownMenuItem
                                    onClick={() => handleEditEmployee(employee)}
                                    className="hover:bg-gray-800"
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Засах
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleToggleEmployeeStatus(employee.id!, employee.active !== false, employee.name)
                                    }
                                    className="hover:bg-gray-800"
                                  >
                                    {employee.active !== false ? (
                                      <>
                                        <PowerOff className="w-4 h-4 mr-2" />
                                        Идэвхгүй болгох
                                      </>
                                    ) : (
                                      <>
                                        <Power className="w-4 h-4 mr-2" />
                                        Идэвхжүүлэх
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteEmployee(employee.id!, employee.name)}
                                    className="text-red-500 hover:bg-gray-800"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Устгах
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Managers List */}
              <TabsContent value="managers">
                <Card className="bg-gray-900 text-white border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Менежерүүдийн жагсаалт</CardTitle>
                    <CardDescription className="text-gray-400">Бүх менежерүүдийн мэдээлэл</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {managers.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">Менежер олдсонгүй</p>
                    ) : (
                      <div className="space-y-4">
                        {managers.map((manager) => (
                          <div
                            key={manager.id}
                            className="flex items-center justify-between p-4 border border-gray-700 rounded-lg"
                          >
                            <div className="flex items-center space-x-4">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={manager.profileImage || "/placeholder.svg"} />
                                <AvatarFallback>
                                  <Shield className="h-6 w-6" />
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold text-white">{manager.name}</h3>
                                <p className="text-sm text-gray-400">Менежер</p>
                                <p className="text-sm text-gray-500">{manager.phone}</p>
                                <p className="text-sm text-gray-500">{manager.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge
                                variant={manager.active !== false ? "default" : "secondary"}
                                className={
                                  manager.active !== false ? "bg-green-700 text-white" : "bg-gray-700 text-gray-300"
                                }
                              >
                                {manager.active !== false ? "Идэвхтэй" : "Идэвхгүй"}
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-gray-300 hover:bg-gray-800">
                                    <Settings className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-gray-900 text-white border-gray-700">
                                  <DropdownMenuItem
                                    onClick={() => handleEditManager(manager)}
                                    className="hover:bg-gray-800"
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Засах
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleToggleManagerStatus(manager.id!, manager.active !== false, manager.name)
                                    }
                                    className="hover:bg-gray-800"
                                  >
                                    {manager.active !== false ? (
                                      <>
                                        <PowerOff className="w-4 h-4 mr-2" />
                                        Идэвхгүй болгох
                                      </>
                                    ) : (
                                      <>
                                        <Power className="w-4 h-4 mr-2" />
                                        Идэвхжүүлэх
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteManager(manager.id!, manager.name)}
                                    className="text-red-500 hover:bg-gray-800"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Устгах
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Drivers List */}
              <TabsContent value="drivers">
                <Card className="bg-gray-900 text-white border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Бүртгэгчийн жагсаалт</CardTitle>
                    <CardDescription className="text-gray-400">Бүх Бүртгэгчийн мэдээлэл</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {drivers.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">Бүртгэгч олдсонгүй</p>
                    ) : (
                      <div className="space-y-4">
                        {drivers.map((driver) => (
                          <div
                            key={driver.id}
                            className="flex items-center justify-between p-4 border border-gray-700 rounded-lg"
                          >
                            <div className="flex items-center space-x-4">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={driver.profileImage || "/placeholder.svg"} />
                                <AvatarFallback>
                                  <Car className="h-6 w-6" />
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold text-white">{driver.name}</h3>
                                <p className="text-sm text-gray-400">Бүртгэгч</p>
                                <p className="text-sm text-gray-500">{driver.phone}</p>
                                <p className="text-sm text-gray-500">{driver.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge
                                variant={driver.active !== false ? "default" : "secondary"}
                                className={
                                  driver.active !== false ? "bg-green-700 text-white" : "bg-gray-700 text-gray-300"
                                }
                              >
                                {driver.active !== false ? "Идэвхтэй" : "Идэвхгүй"}
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-gray-300 hover:bg-gray-800">
                                    <Settings className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-gray-900 text-white border-gray-700">
                                  <DropdownMenuItem
                                    onClick={() => handleEditDriver(driver)}
                                    className="hover:bg-gray-800"
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Засах
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleToggleDriverStatus(driver.id!, driver.active !== false, driver.name)
                                    }
                                    className="hover:bg-gray-800"
                                  >
                                    {driver.active !== false ? (
                                      <>
                                        <PowerOff className="w-4 h-4 mr-2" />
                                        Идэвхгүй болгох
                                      </>
                                    ) : (
                                      <>
                                        <Power className="w-4 h-4 mr-2" />
                                        Идэвхжүүлэх
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteDriver(driver.id!, driver.name)}
                                    className="text-red-500 hover:bg-gray-800"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Устгах
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Registration Tab */}
          <TabsContent value="registration" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Хэрэглэгч бүртгэх</h2>
            </div>

            <Card className="bg-gray-900 text-white border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Шинэ хэрэглэгч бүртгэх</CardTitle>
                <CardDescription className="text-gray-400">Системд шинэ хэрэглэгч нэмэх</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegisterDriver} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="role" className="text-gray-300">
                        Үйлчилгээ
                      </Label>
                      <select
                        id="role"
                        value={selectedRole}
                        onChange={(e) => {
                          setSelectedRole(e.target.value as "manager" | "driver" | "employee")
                          // Reset name and phone when role changes
                          setNewDriver((prev) => ({ ...prev, name: "", phone: "" }))
                        }}
                        className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white"
                      >
                        <option value="employee">Засварчин</option>
                        <option value="driver">Бүртгэгч</option>
                        <option value="manager">Менежер</option>
                      </select>
                      <div className="mt-2 p-3 bg-gray-800 rounded-md">
                        <p className="text-sm text-gray-400">
                          {selectedRole === "employee" && "Засварчин - Зогсоолын үйл ажиллагаанд оролцох эрхтэй"}
                          {selectedRole === "driver" && "Бүртгэгч - Машин бүртгэх, гаргах эрхтэй"}
                          {selectedRole === "manager" && "Менежер - Бүх системийн эрхтэй, тайлан харах боломжтой"}
                        </p>
                      </div>
                    </div>

                    {selectedRole === "employee" && (
                      <div>
                        <Label htmlFor="selectEmployee" className="text-gray-300">
                          Засварчин сонгох
                        </Label>
                        <select
                          id="selectEmployee"
                          value={
                            newDriver.name
                              ? availableEmployees.find((emp) => emp.name === newDriver.name)?.id || ""
                              : ""
                          }
                          onChange={(e) => handleEmployeeSelection(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white"
                        >
                          <option value="">Сонгоно уу</option>
                          {availableEmployees.map((employee) => (
                            <option key={employee.id} value={employee.id}>
                              {employee.name}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Эндээс сонгосноор нэр болон утасны дугаар автоматаар бөглөгдөнө.
                        </p>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="name" className="text-gray-300">
                        Нэр
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        value={newDriver.name}
                        onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
                        placeholder="Бүтэн нэрээ оруулна уу"
                        required
                        className="bg-gray-800 text-white border-gray-700"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-gray-300">
                        Утасны дугаар
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={newDriver.phone}
                        onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
                        placeholder="99112233"
                        className="bg-gray-800 text-white border-gray-700"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-gray-300">
                        И-мэйл хаяг
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={newDriver.email}
                        onChange={(e) => setNewDriver({ ...newDriver, email: e.target.value })}
                        placeholder="example@email.com"
                        required
                        className="bg-gray-800 text-white border-gray-700"
                      />
                    </div>

                    <div>
                      <Label htmlFor="password" className="text-gray-300">
                        Нууц үг
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={newDriver.password}
                        onChange={(e) => setNewDriver({ ...newDriver, password: e.target.value })}
                        placeholder="Хамгийн багадаа 6 тэмдэгт"
                        required
                        minLength={6}
                        className="bg-gray-800 text-white border-gray-700"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={registrationLoading}
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {registrationLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Бүртгэж байна...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        {selectedRole === "manager" ? "Менежер" : selectedRole === "driver" ? "Бүртгэгч" : "Ажилчин"}{" "}
                        бүртгэх
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Зогсоолын тайлан</h2>
              <div className="flex space-x-2">
                <Button
                  onClick={() => setShowDateRangeDialog(true)}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2 bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Хугацаагаар татах</span>
                </Button>
                <Button
                  onClick={exportToExcel}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2 bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
                >
                  <Download className="w-4 h-4" />
                  <span>Excel татах</span>
                </Button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-green-600 text-white border-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Бэлэн мөнгө</p>
                      <p className="text-2xl font-bold">₮{totalCashAmount.toLocaleString()}</p>
                    </div>
                    <div className="bg-green-500 p-2 rounded-full">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-600 text-white border-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Карт</p>
                      <p className="text-2xl font-bold">₮{totalCardAmount.toLocaleString()}</p>
                    </div>
                    <div className="bg-blue-500 p-2 rounded-full">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-600 text-white border-purple-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Харилцах</p>
                      <p className="text-2xl font-bold">₮{totalTransferAmount.toLocaleString()}</p>
                    </div>
                    <div className="bg-purple-500 p-2 rounded-full">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-700 text-white border-gray-600">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-300 text-sm font-medium">Нийт дүн</p>
                      <p className="text-2xl font-bold">
                        ₮{(totalCashAmount + totalCardAmount + totalTransferAmount).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-gray-600 p-2 rounded-full">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="bg-gray-900 text-white border-gray-700">
              <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-gray-800 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">Шүүлтүүр</CardTitle>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${isFilterOpen ? "transform rotate-180" : ""}`}
                      />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div>
                        <Label htmlFor="filterDay" className="text-gray-300">
                          Огноо
                        </Label>
                        <Input
                          id="filterDay"
                          type="date"
                          value={reportFilterDay}
                          onChange={(e) => setReportFilterDay(e.target.value)}
                          className="bg-gray-800 text-white border-gray-700"
                        />
                      </div>
                      <div>
                        <Label htmlFor="filterTime" className="text-gray-300">
                          Цаг
                        </Label>
                        <select
                          id="filterTime"
                          value={reportFilterTime}
                          onChange={(e) => setReportFilterTime(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Бүх цаг</option>
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i.toString().padStart(2, "0")}>
                              {i.toString().padStart(2, "0")}:00
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="filterCarNumber" className="text-gray-300">
                          Машины дугаар
                        </Label>
                        <Input
                          id="filterCarNumber"
                          type="text"
                          value={reportFilterCarNumber}
                          onChange={(e) => setReportFilterCarNumber(e.target.value)}
                          className="bg-gray-800 text-white border-gray-700"
                          placeholder="Машины дугаар"
                        />
                      </div>
                      <div>
                        <Label htmlFor="filterMechanic" className="text-gray-300">
                          Засварчин
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-between bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
                            >
                              {reportFilterMechanic.length > 0
                                ? `${reportFilterMechanic.length} сонгогдсон`
                                : "Засварчин сонгох"}
                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0 bg-gray-900 border-gray-700">
                            <Command className="bg-gray-900">
                              <CommandInput
                                placeholder="Засварчин хайх..."
                                className="bg-gray-800 text-white border-gray-700"
                              />
                              <CommandEmpty className="text-gray-400">Засварчин олдсонгүй.</CommandEmpty>
                              <CommandGroup>
                                <CommandList>
                                  {getAvailableMechanicNames().map((name) => (
                                    <CommandItem
                                      key={name}
                                      onSelect={() => {
                                        setReportFilterMechanic((prev) =>
                                          prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name],
                                        )
                                      }}
                                      className="text-white hover:bg-gray-800"
                                    >
                                      <Checkbox checked={reportFilterMechanic.includes(name)} className="mr-2" />
                                      {name}
                                    </CommandItem>
                                  ))}
                                </CommandList>
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <Label htmlFor="filterPaymentStatus" className="text-gray-300">
                          Төлбөрийн төлөв
                        </Label>
                        <select
                          id="filterPaymentStatus"
                          value={reportFilterPaymentStatus}
                          onChange={(e) => setReportFilterPaymentStatus(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Бүх төлөв</option>
                          <option value="paid">Төлсөн</option>
                          <option value="unpaid">Төлөөгүй</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => {
                          setReportFilterDay("")
                          setReportFilterTime("")
                          setReportFilterCarNumber("")
                          setReportFilterMechanic([])
                          setReportFilterPaymentStatus("")
                        }}
                        variant="outline"
                        size="sm"
                        className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Цэвэрлэх
                      </Button>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>

            {/* Records Table */}
            <Card className="bg-gray-900 text-white border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Зогсоолын бүртгэл ({filteredReportRecords.length} бүртгэл)</CardTitle>
              </CardHeader>
              <CardContent>
                {reportLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredReportRecords.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Бүртгэл олдсонгүй</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left p-1 text-gray-300 text-xs">№</th>
                          <th
                            className="text-left p-1 text-gray-300 cursor-pointer hover:text-white text-xs"
                            onClick={() => handleSort("carNumber")}
                          >
                            Машины дугаар
                            {sortField === "carNumber" && (
                              <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </th>
                          <th
                            className="text-left p-1 text-gray-300 cursor-pointer hover:text-white text-xs"
                            onClick={() => handleSort("mechanicName")}
                          >
                            Засварчин
                            {sortField === "mechanicName" && (
                              <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </th>
                          <th
                            className="text-left p-1 text-gray-300 cursor-pointer hover:text-white text-xs"
                            onClick={() => handleSort("position")}
                          >
                            Үйлчилгээ
                            {sortField === "position" && (
                              <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </th>
                          <th
                            className="text-left p-1 text-gray-300 cursor-pointer hover:text-white text-xs"
                            onClick={() => handleSort("area")}
                          >
                            Талбай
                            {sortField === "area" && (
                              <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </th>
                          <th
                            className="text-left p-1 text-gray-300 cursor-pointer hover:text-white text-xs"
                            onClick={() => handleSort("carBrand")}
                          >
                            Машины марк
                            {sortField === "carBrand" && (
                              <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </th>
                          <th
                            className="text-left p-1 text-gray-300 cursor-pointer hover:text-white text-xs"
                            onClick={() => handleSort("entryTime")}
                          >
                            Орсон цаг
                            {sortField === "entryTime" && (
                              <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </th>
                          <th
                            className="text-left p-1 text-gray-300 cursor-pointer hover:text-white text-xs"
                            onClick={() => handleSort("exitTime")}
                          >
                            Гарсан цаг
                            {sortField === "exitTime" && (
                              <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </th>
                          <th className="text-left p-1 text-gray-300 text-xs">Зогссон хугацаа</th>
                          <th
                            className="text-left p-1 text-gray-300 cursor-pointer hover:text-white text-xs"
                            onClick={() => handleSort("amount")}
                          >
                            Төлбөр (₮)
                            {sortField === "amount" && (
                              <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </th>
                          <th
                            className="text-left p-1 text-gray-300 cursor-pointer hover:text-white text-xs"
                            onClick={() => handleSort("paymentStatus")}
                          >
                            Төлбөрийн төлөв
                            {sortField === "paymentStatus" && (
                              <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </th>
                          <th className="text-left p-1 text-gray-300 text-xs">Зураг</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.keys(groupRecordsByDate(getSortedRecords())).map((dateKey) => (
                          <React.Fragment key={dateKey}>
                            <tr className="bg-gray-800">
                              <td colSpan={12} className="p-2 text-center font-semibold text-lg text-white">
                                {dateKey}
                              </td>
                            </tr>
                            {groupRecordsByDate(getSortedRecords())[dateKey].map((record, index) => {
                              const employee = employees.find(
                                (emp) => emp.name === (record.mechanicName || record.driverName),
                              )
                              return (
                                <tr key={record.id} className="border-b border-gray-800 hover:bg-gray-800">
                                  <td className="p-1 text-gray-300 text-xs">{index + 1}</td>
                                  <td className="p-1 text-white font-medium text-xs">{record.carNumber}</td>
                                  <td className="p-1 text-gray-300 text-xs">
                                    {record.mechanicName || record.driverName || "-"}
                                  </td>
                                  <td className="p-1 text-gray-300 text-xs">{employee?.position || "-"}</td>
                                  <td className="p-1 text-gray-300 text-xs">
                                    {getAreaNameInMongolian(record.parkingArea || record.carBrand)}
                                  </td>
                                  <td className="p-1 text-gray-300 text-xs">{record.carBrand || "-"}</td>
                                  <td className="p-1 text-gray-300 text-xs">{record.entryTime || "-"}</td>
                                  <td className="p-1 text-gray-300 text-xs">{record.exitTime || "-"}</td>
                                  <td className="p-1 text-gray-300 text-xs">
                                    {record.parkingDuration ? `${record.parkingDuration} ц` : "-"}
                                  </td>
                                  <td className="p-1 text-white font-medium text-xs">
                                    <div>₮{calculateParkingFeeForReport(record).toLocaleString()}</div>
                                    {record.cashAmount > 0 && (
                                      <div className="text-gray-400 text-xs">
                                        Бэлэн: ₮{record.cashAmount.toLocaleString()}
                                      </div>
                                    )}
                                    {record.cardAmount > 0 && (
                                      <div className="text-gray-400 text-xs">
                                        Карт: ₮{record.cardAmount.toLocaleString()}
                                      </div>
                                    )}
                                    {record.transferAmount > 0 && (
                                      <div className="text-gray-400 text-xs">
                                        Харилцах: ₮{record.transferAmount.toLocaleString()}
                                      </div>
                                    )}
                                  </td>

                                  <td className="p-1">
                                    {record.paymentStatus === "paid" ? (
                                      <Badge className="bg-green-600 text-white text-xs px-2 py-1 rounded-md font-medium">
                                        Төлсөн
                                      </Badge>
                                    ) : (
                                      <div className="flex items-center space-x-2">
                                        <span className="text-gray-400 text-xs font-medium">Төлөөгүй</span>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handlePaymentStatusUpdate(record)}
                                          className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600 text-xs px-2 py-1 h-6"
                                        >
                                          Төлбөр
                                        </Button>
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-1">
                                    {record.images && record.images.length > 0 ? (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openImageViewer(record.images, 0)}
                                        className="text-blue-400 hover:text-blue-300 hover:bg-gray-800 text-xs p-1 h-6"
                                      >
                                        <Eye className="w-3 h-3 mr-1" />
                                        {record.images.length}
                                      </Button>
                                    ) : (
                                      <span className="text-gray-500 text-xs">-</span>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Хэрэглэгч засах</DialogTitle>
            <DialogDescription className="text-gray-400">Хэрэглэгчийн мэдээллийг шинэчлэх</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editName" className="text-gray-300">
                Нэр
              </Label>
              <Input
                id="editName"
                type="text"
                value={editUserData.name}
                onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                placeholder="Бүтэн нэрээ оруулна уу"
                className="bg-gray-800 text-white border-gray-700"
              />
            </div>
            <div>
              <Label htmlFor="editPhone" className="text-gray-300">
                Утасны дугаар
              </Label>
              <Input
                id="editPhone"
                type="tel"
                value={editUserData.phone}
                onChange={(e) => setEditUserData({ ...editUserData, phone: e.target.value })}
                placeholder="99112233"
                className="bg-gray-800 text-white border-gray-700"
              />
            </div>
            <div>
              <Label htmlFor="editEmail" className="text-gray-300">
                И-мэйл хаяг
              </Label>
              <Input
                id="editEmail"
                type="email"
                value={editUserData.email}
                onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                placeholder="example@email.com"
                className="bg-gray-800 text-white border-gray-700"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
            >
              Цуцлах
            </Button>
            <Button
              onClick={handleSaveUserEdit}
              className="bg-blue-600 text-white hover:bg-blue-700"
              disabled={editLoading}
            >
              {editLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Хадгалж байна...
                </>
              ) : (
                "Хадгалах"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Employee Dialog */}
      <Dialog open={showEmployeeDialog} onOpenChange={setShowEmployeeDialog}>
        <DialogContent className="bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Ажилчин нэмэх</DialogTitle>
            <DialogDescription className="text-gray-400">Шинэ ажилчны мэдээллийг оруулна уу</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddEmployee} className="space-y-4">
            <div>
              <Label htmlFor="employeeName" className="text-gray-300">
                Нэр
              </Label>
              <Input
                id="employeeName"
                type="text"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                placeholder="Бүтэн нэрээ оруулна уу"
                required
                className="bg-gray-800 text-white border-gray-700"
              />
            </div>
            <div>
              <Label htmlFor="employeePosition" className="text-gray-300">
                Үйлчилгээ
              </Label>
              <Input
                id="employeePosition"
                type="text"
                value={newEmployee.position}
                onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
                placeholder="Үйлчилгээ"
                className="bg-gray-800 text-white border-gray-700"
              />
            </div>
            <div>
              <Label htmlFor="employeePhone" className="text-gray-300">
                Утасны дугаар
              </Label>
              <Input
                id="employeePhone"
                type="tel"
                value={newEmployee.phone}
                onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                placeholder="99112233"
                className="bg-gray-800 text-white border-gray-700"
              />
            </div>
            <div>
              <Label htmlFor="employeeStartDate" className="text-gray-300">
                Ажилд орсон огноо
              </Label>
              <Input
                id="employeeStartDate"
                type="date"
                value={newEmployee.startDate}
                onChange={(e) => setNewEmployee({ ...newEmployee, startDate: e.target.value })}
                className="bg-gray-800 text-white border-gray-700"
              />
            </div>
            <div>
              <Label htmlFor="employeeImage" className="text-gray-300">
                Профайл зураг
              </Label>
              <Input
                id="employeeImage"
                type="file"
                accept="image/*"
                onChange={handleEmployeeImageUpload}
                className="bg-gray-800 text-white border-gray-700"
              />
              {newEmployee.profileImage && (
                <Avatar className="h-12 w-12 mt-2">
                  <AvatarImage src={newEmployee.profileImage || "/placeholder.svg"} />
                  <AvatarFallback>
                    <UserIcon className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEmployeeDialog(false)}
                className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
              >
                Цуцлах
              </Button>
              <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700" disabled={employeeLoading}>
                {employeeLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Нэмж байна...
                  </>
                ) : (
                  "Нэмэх"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Профайл засах</DialogTitle>
            <DialogDescription className="text-gray-400">Мэдээллээ шинэчлэх</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="profileName" className="text-gray-300">
                Нэр
              </Label>
              <Input
                id="profileName"
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                placeholder="Бүтэн нэрээ оруулна уу"
                className="bg-gray-800 text-white border-gray-700"
              />
            </div>
            <div>
              <Label htmlFor="profilePhone" className="text-gray-300">
                Утасны дугаар
              </Label>
              <Input
                id="profilePhone"
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                placeholder="99112233"
                className="bg-gray-800 text-white border-gray-700"
              />
            </div>
            <div>
              <Label htmlFor="profileEmail" className="text-gray-300">
                И-мэйл хаяг
              </Label>
              <Input
                id="profileEmail"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                placeholder="example@email.com"
                className="bg-gray-800 text-white border-gray-700"
              />
            </div>
            <div>
              <Label htmlFor="profileImage" className="text-gray-300">
                Профайл зураг
              </Label>
              <Input
                id="profileImage"
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, "profile")}
                className="bg-gray-800 text-white border-gray-700"
              />
              {profileData.profileImage && (
                <Avatar className="h-12 w-12 mt-2">
                  <AvatarImage src={profileData.profileImage || "/placeholder.svg"} />
                  <AvatarFallback>
                    <UserIcon className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
            <div>
              <Label htmlFor="currentPassword" className="text-gray-300">
                Одоогийн нууц үг
              </Label>
              <Input
                id="currentPassword"
                type={showPassword ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder="Нууц үгээ оруулна уу"
                className="bg-gray-800 text-white border-gray-700"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-300 hover:bg-gray-800 mt-1"
              >
                {showPassword ? "Нуух" : "Харах"}
              </Button>
            </div>
            <div>
              <Label htmlFor="newPassword" className="text-gray-300">
                Шинэ нууц үг
              </Label>
              <Input
                id="newPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Шинэ нууц үг"
                className="bg-gray-800 text-white border-gray-700"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-gray-300 hover:bg-gray-800 mt-1"
              >
                {showConfirmPassword ? "Нуух" : "Харах"}
              </Button>
            </div>
            <div>
              <Label htmlFor="confirmPassword" className="text-gray-300">
                Нууц үг баталгаажуулах
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Нууц үгээ дахин оруулна уу"
                className="bg-gray-800 text-white border-gray-700"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowProfileDialog(false)}
              className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
            >
              Цуцлах
            </Button>
            <Button
              onClick={handleSaveProfile}
              className="bg-blue-600 text-white hover:bg-blue-700"
              disabled={profileLoading}
            >
              {profileLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Хадгалж байна...
                </>
              ) : (
                "Хадгалах"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Status Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={() => setShowPaymentDialog(false)}>
        <DialogContent className="bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Төлбөрийн төлөв шинэчлэх</DialogTitle>
            <DialogDescription className="text-gray-400">Төлбөрийн мэдээллийг оруулна уу</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cashAmount" className="text-gray-300">
                Бэлэн мөнгө (₮)
              </Label>
              <Input
                id="cashAmount"
                type="number"
                value={cashAmountInput}
                onChange={(e) => setCashAmountInput(Number(e.target.value))}
                placeholder="0"
                className="bg-gray-800 text-white border-gray-700"
              />
            </div>
            <div>
              <Label htmlFor="cardAmount" className="text-gray-300">
                Карт (₮)
              </Label>
              <Input
                id="cardAmount"
                type="number"
                value={cardAmountInput}
                onChange={(e) => setCardAmountInput(Number(e.target.value))}
                placeholder="0"
                className="bg-gray-800 text-white border-gray-700"
              />
            </div>
            <div>
              <Label htmlFor="transferAmount" className="text-gray-300">
                Харилцах (₮)
              </Label>
              <Input
                id="transferAmount"
                type="number"
                value={transferAmountInput}
                onChange={(e) => setTransferAmountInput(Number(e.target.value))}
                placeholder="0"
                className="bg-gray-800 text-white border-gray-700"
              />
            </div>
            <div className="text-gray-400">Төлөх дүн: ₮{initialAmountToPay.toLocaleString()}</div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPaymentDialog(false)}
              className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
            >
              Цуцлах
            </Button>
            <Button
              onClick={handleSavePaymentStatus}
              className="bg-blue-600 text-white hover:bg-blue-700"
              disabled={paymentLoading}
            >
              {paymentLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Хадгалж байна...
                </>
              ) : (
                "Хадгалах"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Record Dialog */}
      <Dialog open={showEditRecordDialog} onOpenChange={() => setShowEditRecordDialog(false)}>
        <DialogContent className="bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Бүртгэл засах</DialogTitle>
            <DialogDescription className="text-gray-400">Бүртгэлийн мэдээллийг шинэчлэх</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editCarNumber" className="text-gray-300">
                Машины дугаар
              </Label>
              <Input
                id="editCarNumber"
                type="text"
                value={editRecordData.carNumber}
                onChange={(e) => setEditRecordData({ ...editRecordData, carNumber: e.target.value })}
                placeholder="Машины дугаарыг оруулна уу"
                className="bg-gray-800 text-white border-gray-700"
              />
            </div>
            <div>
              <Label htmlFor="editMechanicName" className="text-gray-300">
                Засварчин
              </Label>
              <Input
                id="editMechanicName"
                type="text"
                value={editRecordData.mechanicName}
                onChange={(e) => setEditRecordData({ ...editRecordData, mechanicName: e.target.value })}
                placeholder="Засварчны нэрийг оруулна уу"
                className="bg-gray-800 text-white border-gray-700"
              />
            </div>
            <div>
              <Label htmlFor="editCarBrand" className="text-gray-300">
                Машины марк
              </Label>
              <Input
                id="editCarBrand"
                type="text"
                value={editRecordData.carBrand}
                onChange={(e) => setEditRecordData({ ...editRecordData, carBrand: e.target.value })}
                placeholder="Машины маркийг оруулна уу"
                className="bg-gray-800 text-white border-gray-700"
              />
            </div>
            <div>
              <Label htmlFor="editParkingArea" className="text-gray-300">
                Талбай
              </Label>
              <select
                id="editParkingArea"
                value={editRecordData.parkingArea}
                onChange={(e) => setEditRecordData({ ...editRecordData, parkingArea: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">Талбай</option>
                <option value="leather">Тен</option>
                <option value="spare">Сафари</option>
                <option value="safari">Сафари талбай</option>
              </select>
            </div>
            <div>
              <Label htmlFor="editEntryTime" className="text-gray-300">
                Орсон цаг
              </Label>
              <Input
                id="editEntryTime"
                type="text"
                value={editRecordData.entryTime}
                onChange={(e) => setEditRecordData({ ...editRecordData, entryTime: e.target.value })}
                placeholder="Орсон цагийг оруулна уу"
                className="bg-gray-800 text-white border-gray-700"
              />
            </div>
            <div>
              <Label htmlFor="editExitTime" className="text-gray-300">
                Гарсан цаг
              </Label>
              <Input
                id="editExitTime"
                type="text"
                value={editRecordData.exitTime}
                onChange={(e) => setEditRecordData({ ...editRecordData, exitTime: e.target.value })}
                placeholder="Гарсан цагийг оруулна уу"
                className="bg-gray-800 text-white border-gray-700"
              />
            </div>
            <div>
              <Label htmlFor="editParkingDuration" className="text-gray-300">
                Зогссон хугацаа
              </Label>
              <Input
                id="editParkingDuration"
                type="text"
                value={editRecordData.parkingDuration}
                onChange={(e) => setEditRecordData({ ...editRecordData, parkingDuration: e.target.value })}
                placeholder="Зогссон хугацааг оруулна уу"
                className="bg-gray-800 text-white border-gray-700"
              />
            </div>
            <div>
              <Label htmlFor="editAmount" className="text-gray-300">
                Төлбөр
              </Label>
              <Input
                id="editAmount"
                type="number"
                value={editRecordData.amount}
                onChange={(e) => setEditRecordData({ ...editRecordData, amount: Number(e.target.value) })}
                placeholder="Төлбөрийг оруулна уу"
                className="bg-gray-800 text-white border-gray-700"
              />
            </div>
            <div>
              <Label htmlFor="editImages" className="text-gray-300">
                Зураг
              </Label>
              <Input
                id="editImages"
                type="file"
                accept="image/*"
                onChange={handleImageUploadForRecord}
                className="bg-gray-800 text-white border-gray-700"
              />
              <div className="flex space-x-2 mt-2">
                {editRecordData.images.map((image, index) => (
                  <div key={index} className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={image || "/placeholder.svg"} />
                      <AvatarFallback>
                        <UserIcon className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRecordImage(index)}
                      className="absolute top-0 right-0 bg-gray-700 text-white hover:bg-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditRecordDialog(false)}
              className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
            >
              Цуцлах
            </Button>
            <Button
              onClick={handleSaveRecordEdit}
              className="bg-blue-600 text-white hover:bg-blue-700"
              disabled={editRecordLoading}
            >
              {editRecordLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Хадгалж байна...
                </>
              ) : (
                "Хадгалах"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Date Range Export Dialog */}
      <Dialog open={showDateRangeDialog} onOpenChange={setShowDateRangeDialog}>
        <DialogContent className="bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Огнооны хүрээ сонгох</DialogTitle>
            <DialogDescription className="text-gray-400">Тайлангийн хугацааг сонгоно уу</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="dateRangeStart" className="text-gray-300">
                Эхлэх огноо
              </Label>
              <Input
                id="dateRangeStart"
                type="date"
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
                className="bg-gray-800 text-white border-gray-700"
              />
            </div>
            <div>
              <Label htmlFor="dateRangeEnd" className="text-gray-300">
                Дуусах огноо
              </Label>
              <Input
                id="dateRangeEnd"
                type="date"
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
                className="bg-gray-800 text-white border-gray-700"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="deleteAfterExport"
                checked={deleteAfterExport}
                onCheckedChange={setDeleteAfterExport}
                className="text-blue-500"
              />
              <Label
                htmlFor="deleteAfterExport"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed text-gray-300"
              >
                Экспортын дараа устгах
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDateRangeDialog(false)}
              className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
            >
              Цуцлах
            </Button>
            <Button
              onClick={handleDateRangeExport}
              className="bg-blue-600 text-white hover:bg-blue-700"
              disabled={exportLoading}
            >
              {exportLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Экспортлож байна...
                </>
              ) : (
                "Экспортлох"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Viewer */}
      <Dialog open={showImageViewer} onOpenChange={setShowImageViewer}>
        <DialogContent className="bg-black text-white border-none shadow-none">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={closeImageViewer}
              className="absolute top-2 right-2 text-gray-300 hover:bg-gray-800"
            >
              <X className="h-6 w-6" />
            </Button>
            {currentImages.length > 0 && (
              <>
                <img
                  src={currentImages[currentImageIndex] || "/placeholder.svg"}
                  alt={`Image ${currentImageIndex + 1}`}
                  className="max-h-[80vh] max-w-[80vw] object-contain"
                />
                <div className="absolute bottom-2 left-2 flex space-x-2">
                  <Button variant="ghost" size="icon" onClick={prevImage} className="text-gray-300 hover:bg-gray-800">
                    <ChevronDown className="h-6 w-6 transform rotate-90" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={nextImage} className="text-gray-300 hover:bg-gray-800">
                    <ChevronDown className="h-6 w-6 transform -rotate-90" />
                  </Button>
                </div>
                <div className="absolute bottom-2 right-2 text-gray-300">
                  {currentImageIndex + 1} / {currentImages.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
