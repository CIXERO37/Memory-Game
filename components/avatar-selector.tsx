"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { RobustGoogleAvatar } from "./robust-google-avatar"

const allAvatars = [
  "/ava1.webp", "/ava2.webp", "/ava3.webp", "/ava4.webp", 
  "/ava5.webp", "/ava6.webp", "/ava7.webp", "/ava8.webp", 
  "/ava9.webp", "/ava10.webp", "/ava11.webp", "/ava12.webp", 
  "/ava13.webp", "/ava14.webp", "/ava15.webp", "/ava16.webp"
]

interface AvatarSelectorProps {
  selectedAvatar: string
  onAvatarSelect: (avatar: string) => void
  onFirstAvatarChange?: (avatar: string) => void
  externalAvatar?: string // optional external avatar URL (e.g., Google photo)
}

export function AvatarSelector({ selectedAvatar, onAvatarSelect, onFirstAvatarChange, externalAvatar }: AvatarSelectorProps) {
  // Simpan urutan avatar dalam state agar tidak berubah saat re-render
  const [avatars, setAvatars] = React.useState<string[]>([])
  const [isInitialized, setIsInitialized] = React.useState(false)
  
  // Debug logging
  React.useEffect(() => {
    console.log('=== AVATAR SELECTOR DEBUG ===')
    console.log('External Avatar:', externalAvatar)
    console.log('Selected Avatar:', selectedAvatar)
    console.log('Is External Avatar Valid:', externalAvatar && externalAvatar.length > 0)
    console.log('Is Initialized:', isInitialized)
    console.log('============================')
  }, [externalAvatar, selectedAvatar, isInitialized])
  
  // Initialize avatars hanya sekali saat mount - tidak berubah lagi
  React.useEffect(() => {
    if (isInitialized) return // Prevent re-initialization
    
    // Buat urutan avatar yang tetap konsisten
    let initialAvatars: string[] = []
    
    if (externalAvatar && externalAvatar.length > 0) {
      // Jika ada external avatar, letakkan di depan
      initialAvatars = [externalAvatar, ...allAvatars]
    } else {
      // Jika tidak ada external avatar, gunakan urutan default
      initialAvatars = [...allAvatars]
    }
    
    setAvatars(initialAvatars)
    setIsInitialized(true)
    
    // Notify parent about the initial avatar
    if (onFirstAvatarChange) {
      const initialAvatar = initialAvatars[0]
      onFirstAvatarChange(initialAvatar)
    }
  }, []) // Empty dependency array - hanya jalankan sekali saat mount

  // Handle external avatar yang datang setelah mount tanpa mengubah urutan
  React.useEffect(() => {
    if (!isInitialized || !externalAvatar || externalAvatar.length === 0) return
    
    // Jika external avatar belum ada di list, tambahkan di depan tanpa mengubah urutan yang ada
    setAvatars(prev => {
      if (prev.includes(externalAvatar)) return prev
      return [externalAvatar, ...prev]
    })
    
    // Jika belum ada avatar yang dipilih, pilih external avatar
    if (!selectedAvatar || selectedAvatar.length === 0) {
      onAvatarSelect(externalAvatar)
    }
  }, [externalAvatar, selectedAvatar, onAvatarSelect, isInitialized])
  
  return (
    <div className="relative avatar-selector">
      {/* Scrollable container with fixed height for 2 rows */}
      <div className="h-32 sm:h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
        <div className="grid grid-cols-4 gap-2 sm:gap-4 pb-2 p-2">
          {avatars.map((avatar) => {
            const isSelected = avatar === selectedAvatar
            return (
              <button
                key={avatar}
                className={`
                  relative w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 sm:border-4 transition-all duration-200 hover:scale-110
                  min-h-[44px] min-w-[44px]
                  ${isSelected
                    ? 'border-cyan-400 shadow-lg shadow-cyan-400/50 scale-110' 
                    : 'border-gray-300 hover:border-gray-400'
                  }
                `}
                onClick={() => onAvatarSelect(avatar)}
              >
                {/* Support external URLs by using RobustGoogleAvatar for better loading */}
                {/^https?:\/\//.test(avatar) ? (
                  <RobustGoogleAvatar
                    avatarUrl={avatar}
                    alt="Avatar"
                    width={64}
                    height={64}
                    className="w-full h-full"
                  />
                ) : (
                  <Image
                    src={avatar}
                    alt="Avatar"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                )}
                {isSelected && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-400/20 pointer-events-none" />
                )}
              </button>
            )
          })}
        </div>
      </div>
      
    </div>
  )
}
  