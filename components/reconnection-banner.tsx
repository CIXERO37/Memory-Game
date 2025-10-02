"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react"

interface ReconnectionBannerProps {
  isConnected: boolean
  isReconnecting: boolean
  reconnectionAttempts: number
  canReconnect: boolean
  lastDisconnect: Date | null
  onReconnect: () => void
  onDismiss?: () => void
}

export function ReconnectionBanner({
  isConnected,
  isReconnecting,
  reconnectionAttempts,
  canReconnect,
  lastDisconnect,
  onReconnect,
  onDismiss
}: ReconnectionBannerProps) {
  const [showBanner, setShowBanner] = useState(false)
  const [autoReconnectCountdown, setAutoReconnectCountdown] = useState(0)

  // Show banner when disconnected or reconnecting
  useEffect(() => {
    setShowBanner(!isConnected || isReconnecting)
  }, [isConnected, isReconnecting])

  // Auto-reconnect countdown
  useEffect(() => {
    if (!isConnected && canReconnect && !isReconnecting && reconnectionAttempts < 3) {
      setAutoReconnectCountdown(5) // 5 second countdown
      
      const interval = setInterval(() => {
        setAutoReconnectCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            onReconnect() // Auto-reconnect
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    } else {
      setAutoReconnectCountdown(0)
    }
  }, [isConnected, canReconnect, isReconnecting, reconnectionAttempts, onReconnect])

  if (!showBanner) return null

  const getStatusInfo = () => {
    if (isReconnecting) {
      return {
        icon: <RefreshCw className="h-4 w-4 animate-spin" />,
        title: "Menyambung kembali...",
        description: `Mencoba menyambung kembali ke permainan (percobaan ${reconnectionAttempts})`,
        variant: "default" as const,
        bgColor: "bg-blue-50 border-blue-200",
        textColor: "text-blue-800"
      }
    }

    if (!isConnected && canReconnect) {
      return {
        icon: <WifiOff className="h-4 w-4" />,
        title: "Koneksi terputus",
        description: autoReconnectCountdown > 0 
          ? `Akan mencoba menyambung kembali dalam ${autoReconnectCountdown} detik...`
          : "Koneksi ke server terputus. Klik untuk menyambung kembali.",
        variant: "destructive" as const,
        bgColor: "bg-red-50 border-red-200",
        textColor: "text-red-800"
      }
    }

    if (!isConnected && !canReconnect) {
      return {
        icon: <AlertTriangle className="h-4 w-4" />,
        title: "Tidak dapat menyambung kembali",
        description: "Permainan mungkin sudah selesai atau Anda telah dikeluarkan dari ruangan.",
        variant: "destructive" as const,
        bgColor: "bg-red-50 border-red-200",
        textColor: "text-red-800"
      }
    }

    return {
      icon: <CheckCircle className="h-4 w-4" />,
      title: "Tersambung",
      description: "Koneksi ke server berhasil dipulihkan",
      variant: "default" as const,
      bgColor: "bg-green-50 border-green-200",
      textColor: "text-green-800"
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
      <Alert className={`${statusInfo.bgColor} ${statusInfo.textColor} shadow-lg border-2`}>
        <div className="flex items-center gap-3">
          {statusInfo.icon}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">{statusInfo.title}</div>
            <AlertDescription className="text-xs mt-1">
              {statusInfo.description}
            </AlertDescription>
            {lastDisconnect && (
              <div className="text-xs opacity-75 mt-1">
                Terputus pada: {lastDisconnect.toLocaleTimeString('id-ID')}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {!isConnected && canReconnect && !isReconnecting && autoReconnectCountdown === 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={onReconnect}
                className="text-xs px-3 py-1 h-auto bg-white hover:bg-gray-50"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Sambung
              </Button>
            )}
            
            {onDismiss && isConnected && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  onDismiss()
                  setShowBanner(false)
                }}
                className="text-xs px-2 py-1 h-auto hover:bg-white/50"
              >
                ✕
              </Button>
            )}
          </div>
        </div>
        
        {/* Progress bar for auto-reconnect countdown */}
        {autoReconnectCountdown > 0 && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div 
                className="bg-blue-500 h-1 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${((5 - autoReconnectCountdown) / 5) * 100}%` }}
              />
            </div>
          </div>
        )}
      </Alert>
    </div>
  )
}

// Komponen yang lebih sederhana untuk status koneksi di corner
export function ConnectionStatus({ isConnected }: { isConnected: boolean }) {
  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium shadow-lg border-2 ${
        isConnected 
          ? 'bg-green-100 border-green-300 text-green-800' 
          : 'bg-red-100 border-red-300 text-red-800'
      }`}>
        {isConnected ? (
          <>
            <Wifi className="h-3 w-3" />
            <span>Terhubung</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            <span>Terputus</span>
          </>
        )}
      </div>
    </div>
  )
}
