"use client"

import React, { useState } from 'react'
import { UserProfile } from '@/hooks/use-auth'
import { RobustGoogleAvatar } from './robust-google-avatar'

interface UserProfileProps {
  userProfile: UserProfile
}

export function UserProfileComponent({ userProfile }: UserProfileProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  
  // Debug logging
  console.log('=== USER PROFILE COMPONENT ===')
  console.log('UserProfile:', userProfile)
  console.log('Avatar URL:', userProfile.avatar_url)
  console.log('=============================')
  
  // Reset error state when avatar URL changes
  React.useEffect(() => {
    setImageError(false)
    setImageLoading(true)
    setRetryCount(0)
  }, [userProfile.avatar_url])
  
  const handleImageError = () => {
    console.log('Avatar image failed to load, retry count:', retryCount)
    if (retryCount < 2) {
      // Retry loading the image
      setRetryCount(prev => prev + 1)
      setImageLoading(true)
      setTimeout(() => {
        setImageError(false)
      }, 1000)
    } else {
      setImageError(true)
      setImageLoading(false)
    }
  }
  
  const handleImageLoad = () => {
    console.log('Avatar image loaded successfully')
    setImageError(false)
    setImageLoading(false)
  }
  
  return (
    <div className="flex items-center gap-3 bg-purple-800/80 backdrop-blur-sm border-2 border-purple-300 rounded-lg px-3 py-2 shadow-xl">
      {/* Avatar */}
      <div className="relative">
        {userProfile.avatar_url ? (
          <RobustGoogleAvatar
            avatarUrl={userProfile.avatar_url}
            alt={userProfile.name || userProfile.username}
            className="w-8 h-8"
            width={32}
            height={32}
          />
        ) : (
          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full border-2 border-purple-200 flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {userProfile.username.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      
      {/* Name */}
      <div className="flex flex-col">
        <span className="text-white font-bold text-sm leading-tight">
          {userProfile.name || userProfile.username}
        </span>
      </div>
    </div>
  )
}
