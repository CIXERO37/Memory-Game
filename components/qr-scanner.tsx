"use client"

import { useState, useEffect, useRef } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface QRScannerProps {
  onScan: (data: string) => void
  onClose: () => void
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [error, setError] = useState<string>("")
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const qrCodeRegionId = "qr-reader"

  useEffect(() => {
    let mounted = true

    const startScanner = async () => {
      try {
        // Check if camera is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          if (mounted) {
            setHasPermission(false)
            setError("Camera not supported on this device.")
          }
          return
        }

        // Request camera permission
        await navigator.mediaDevices.getUserMedia({ video: true })
        if (!mounted) return
        
        setHasPermission(true)

        // Initialize scanner
        const html5QrCode = new Html5Qrcode(qrCodeRegionId)
        scannerRef.current = html5QrCode

        // Start scanning
        await html5QrCode.start(
          { facingMode: "environment" }, // Use back camera on mobile
          {
            fps: 10, // Frames per second
            qrbox: { width: 250, height: 250 }, // Scanning box size
          },
          (decodedText) => {
            // Success callback - QR code found
            if (mounted) {
              console.log("QR Code scanned:", decodedText)
              onScan(decodedText)
            }
          },
          (errorMessage) => {
            // Error callback - mostly "No QR code found"
            // We don't need to show these errors
          }
        )

        if (mounted) {
          setIsScanning(true)
        }
      } catch (err: any) {
        console.error("Camera permission error:", err)
        if (mounted) {
          setHasPermission(false)
          setError("Camera access denied. Please allow camera access to scan QR code.")
        }
      }
    }

    startScanner()

    // Cleanup function
    return () => {
      mounted = false
      if (scannerRef.current) {
        scannerRef.current.stop().catch((err) => {
          console.error("Error stopping scanner on cleanup:", err)
        })
      }
    }
  }, [])

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
        setIsScanning(false)
      } catch (err) {
        console.error("Error stopping scanner:", err)
      }
    }
  }

  const handleClose = () => {
    stopScanner()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" style={{ background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(31, 41, 55, 0.98), rgba(55, 65, 81, 0.98))', backdropFilter: 'blur(16px)' }}>
      <div className="relative w-full max-w-lg animate-fade-in-up">
        {/* Close Button - Elegant */}
        <Button
          onClick={handleClose}
          variant="ghost"
          size="icon"
          className="absolute -top-14 right-0 z-10 bg-gradient-to-br from-white to-gray-100 hover:from-white hover:to-white border-2 border-gray-200 rounded-full shadow-2xl text-gray-700 hover:text-gray-900 hover:scale-110 hover:rotate-90 transition-all duration-300 h-11 w-11"
        >
          <X className="h-5 w-5" strokeWidth={2.5} />
        </Button>

        {/* Scanner Container - Premium Glass Design */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 backdrop-blur-xl border-2 border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 animate-spin" style={{ animationDuration: '20s' }}></div>
          </div>

          {/* Header - Premium Design */}
          <div className="relative px-6 py-5 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-pink-600/30 backdrop-blur-md border-b border-white/10">
            <div className="flex items-center justify-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-400 rounded-full blur-md opacity-50 animate-pulse"></div>
                <div className="relative w-2.5 h-2.5 rounded-full bg-blue-400"></div>
              </div>
              <h3 className="text-lg font-bold text-white tracking-wide">Scan QR Code</h3>
              <div className="relative">
                <div className="absolute inset-0 bg-purple-400 rounded-full blur-md opacity-50 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <div className="relative w-2.5 h-2.5 rounded-full bg-purple-400"></div>
              </div>
            </div>
            {/* Subtle underline effect */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          </div>

          {/* Scanner Area - Premium Black with Glow */}
          <div className="relative bg-gradient-to-b from-black via-gray-950 to-black" style={{ minHeight: "450px" }}>
            {/* Ambient Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 via-transparent to-purple-500/5"></div>

            {hasPermission === null && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="text-center space-y-5">
                  <div className="relative inline-block">
                    {/* Multiple Rings */}
                    <div className="absolute inset-0 rounded-full border-4 border-blue-400/30 animate-ping"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-purple-400/30 animate-ping" style={{ animationDelay: '0.3s' }}></div>
                    {/* Main Spinner */}
                    <div className="relative w-20 h-20 rounded-full border-[5px] border-transparent border-t-blue-500 border-r-purple-500 animate-spin shadow-lg shadow-blue-500/50"></div>
                    {/* Center Glow */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-md"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-white text-base">Initializing Camera</p>
                    <p className="text-xs text-gray-400">Please grant camera permission</p>
                  </div>
                </div>
              </div>
            )}

            {hasPermission === false && (
              <div className="absolute inset-0 flex items-center justify-center p-8 z-10">
                <div className="text-center space-y-6 max-w-sm">
                  <div className="relative inline-block">
                    {/* Pulsing Glow */}
                    <div className="absolute inset-0 bg-red-500/30 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute inset-0 bg-red-400/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                    {/* Icon Container */}
                    <div className="relative w-24 h-24 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-full flex items-center justify-center shadow-2xl shadow-red-500/50 border-4 border-red-400/30">
                      <X className="h-12 w-12 text-white drop-shadow-lg" strokeWidth={3} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="font-bold text-white text-xl">Camera Access Denied</p>
                    <p className="text-sm text-gray-300 leading-relaxed px-4">{error}</p>
                  </div>
                  <Button
                    onClick={handleClose}
                    className="mt-2 bg-gradient-to-r from-red-500 via-red-600 to-red-500 hover:from-red-600 hover:via-red-700 hover:to-red-600 text-white border-2 border-red-400/50 rounded-full font-bold px-10 py-3 shadow-xl shadow-red-500/30 hover:shadow-2xl hover:shadow-red-500/50 transform hover:scale-105 transition-all duration-300"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}

            {/* QR Scanner Region */}
            <div 
              id={qrCodeRegionId} 
              className="w-full h-full"
              style={{
                display: hasPermission === true ? 'block' : 'none'
              }}
            />

          </div>

          {/* Bottom Accent - Enhanced */}
          <div className="relative h-1.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ animationDuration: '2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}

