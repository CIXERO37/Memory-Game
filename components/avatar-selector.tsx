"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"

const avatars = [
  "/ava1.png", "/ava2.png", "/ava3.png", "/ava4.png", 
  "/ava5.png", "/ava6.png", "/ava7.png", "/ava8.png", 
  "/ava9.png", "/ava10.png", "/ava11.png", "/ava12.png", 
  "/ava13.png", "/ava14.png", "/ava15.png", "/ava16.png"
]

interface AvatarSelectorProps {
  selectedAvatar: string
  onAvatarSelect: (avatar: string) => void
}

export function AvatarSelector({ selectedAvatar, onAvatarSelect }: AvatarSelectorProps) {
  return (
    <div className="relative avatar-selector">
      {/* Scrollable container with fixed height for 2 rows */}
      <div className="h-32 sm:h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
        <div className="grid grid-cols-4 gap-2 sm:gap-4 pb-2 p-2">
          {avatars.map((avatar) => (
            <button
              key={avatar}
              className={`
                relative w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 sm:border-4 transition-all duration-200 hover:scale-110
                min-h-[44px] min-w-[44px] // Touch-friendly minimum size
                ${selectedAvatar === avatar 
                  ? 'border-cyan-400 shadow-lg shadow-cyan-400/50 scale-110' 
                  : 'border-gray-300 hover:border-gray-400'
                }
              `}
              onClick={() => onAvatarSelect(avatar)}
            >
              <Image
                src={avatar}
                alt="Avatar"
                width={64}
                height={64}
                className="w-full h-full object-cover"
                draggable={false}
              />
              {selectedAvatar === avatar && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-400/20 pointer-events-none" />
              )}
            </button>
          ))}
        </div>
      </div>
      
    </div>
  )
}
  