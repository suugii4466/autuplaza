"use client"

import { useState, useEffect } from "react"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt(): Promise<void>
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [isChrome, setIsChrome] = useState(false)

  useEffect(() => {
    // Detect device and browser type
    const userAgent = navigator.userAgent.toLowerCase()
    const isIOSDevice = /ipad|iphone|ipod/.test(userAgent)
    const isAndroidDevice = /android/.test(userAgent)
    const isChromeDevice = /chrome/.test(userAgent) && !/edg/.test(userAgent)

    setIsIOS(isIOSDevice)
    setIsAndroid(isAndroidDevice)
    setIsChrome(isChromeDevice)

    console.log("Device detection:", { isIOSDevice, isAndroidDevice, isChromeDevice })

    // Check if app is already installed
    const checkIfInstalled = () => {
      // Check for standalone mode (PWA is installed)
      if (window.matchMedia("(display-mode: standalone)").matches) {
        console.log("App is installed - standalone mode")
        setIsInstalled(true)
        return true
      }

      // Check for iOS Safari standalone mode
      if ((window.navigator as any).standalone === true) {
        console.log("App is installed - iOS standalone")
        setIsInstalled(true)
        return true
      }

      // Check if running in TWA (Trusted Web Activity) on Android
      if (document.referrer.includes("android-app://")) {
        console.log("App is installed - TWA")
        setIsInstalled(true)
        return true
      }

      return false
    }

    if (checkIfInstalled()) {
      return
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("beforeinstallprompt event fired")
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      console.log("App was installed")
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    // Listen for the beforeinstallprompt event
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    // For Android Chrome, we should always show install option
    if (isAndroidDevice && isChromeDevice) {
      setIsInstallable(true)
      console.log("Android Chrome detected - install option enabled")
    }

    // For iOS, always show install option
    if (isIOSDevice) {
      setIsInstallable(true)
      console.log("iOS detected - install option enabled")
    }

    // Check PWA criteria
    const checkPWACriteria = () => {
      // Check if service worker is registered
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          console.log("Service Worker registrations:", registrations.length)
        })
      }

      // Check if manifest is present
      const manifestLink = document.querySelector('link[rel="manifest"]')
      console.log("Manifest link found:", !!manifestLink)
    }

    checkPWACriteria()

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const installApp = async () => {
    console.log("Install app called", { deferredPrompt: !!deferredPrompt, isAndroid, isChrome })

    // For Android Chrome with beforeinstallprompt support
    if (deferredPrompt) {
      try {
        console.log("Showing native install prompt")
        await deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        console.log("User choice:", outcome)

        setDeferredPrompt(null)

        if (outcome === "accepted") {
          console.log("User accepted the install prompt")
          setIsInstalled(true)
          setIsInstallable(false)
          return true
        } else {
          console.log("User dismissed the install prompt")
          return false
        }
      } catch (error) {
        console.error("Installation prompt failed:", error)
        // Fallback to manual instructions
        showAndroidInstructions()
        return false
      }
    }

    // For iOS Safari
    if (isIOS) {
      const isInStandaloneMode = (window.navigator as any).standalone
      const isInWebAppiOS = window.matchMedia("(display-mode: standalone)").matches

      if (!isInStandaloneMode && !isInWebAppiOS) {
        showIOSInstructions()
        return false
      }
      return false
    }

    // For Android Chrome without beforeinstallprompt (fallback)
    if (isAndroid && isChrome) {
      showAndroidInstructions()
      return false
    }

    // For other Android browsers
    if (isAndroid) {
      showAndroidGenericInstructions()
      return false
    }

    // For other browsers
    showGenericInstructions()
    return false
  }

  const showIOSInstructions = () => {
    alert(`📱 iOS дээр суулгахын тулд:

1. Safari browser ашиглана уу
2. Доод хэсгээс "Share" (📤) товч дарна уу  
3. "Add to Home Screen" сонгоно уу
4. "Add" товч дарж баталгаажуулна уу

Суулгасны дараа нүүр хуудсанаас апп нээж болно!`)
  }

  const showAndroidInstructions = () => {
    alert(`📱 Android Chrome дээр суулгахын тулд:

1. Баруун дээд буланд байгаа цэс (⋮) дарна уу
2. "Add to Home screen" эсвэл "Install app" сонгоно уу
3. "Install" товч дарж баталгаажуулна уу

Суулгасны дараа апп жагсаалтаас нээж болно!`)
  }

  const showAndroidGenericInstructions = () => {
    alert(`📱 Android дээр суулгахын тулд:

1. Browser-ийн цэс нээнэ үү
2. "Add to Home screen" сонгоно уу
3. Нэр оруулаад "Add" дарна уу

Суулгасны дараа нүүр хуудсанаас нээж болно!`)
  }

  const showGenericInstructions = () => {
    alert(`📱 Энэ browser дээр суулгахын тулд:

1. Browser-ийн цэс нээнэ үү
2. "Add to Home screen" эсвэл "Install" сонгоно уу
3. Заавар дагуу суулгана уу`)
  }

  return {
    isInstallable: isInstallable && !isInstalled,
    isInstalled,
    installApp,
    canInstall: isInstallable && !isInstalled,
    isIOS,
    isAndroid,
    isChrome,
  }
}
