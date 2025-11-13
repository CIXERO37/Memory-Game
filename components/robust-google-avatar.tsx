"use client"

import React, { useState, useEffect } from 'react'

interface RobustGoogleAvatarProps {
  avatarUrl: string
  alt: string
  className?: string
  width?: number
  height?: number
}

export function RobustGoogleAvatar({ avatarUrl, alt, className = "", width = 32, height = 32 }: RobustGoogleAvatarProps) {
  const [imageSrc, setImageSrc] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [method, setMethod] = useState<string>('')

  useEffect(() => {
    if (!avatarUrl) {
      setError(true)
      setLoading(false)
      return
    }

    const loadAvatar = async () => {
      try {
        // Optimized: Try original URL first (most likely to work)
        const testImg = new Image()
        testImg.crossOrigin = 'anonymous'
        
        // Add timeout to prevent hanging
        const timeoutId = setTimeout(() => {
          testImg.src = '' // Cancel load
        }, 2000) // 2 second timeout
        
        const loadPromise = new Promise((resolve, reject) => {
          testImg.onload = () => {
            clearTimeout(timeoutId)
            resolve(avatarUrl)
          }
          testImg.onerror = () => {
            clearTimeout(timeoutId)
            reject(new Error('Failed to load'))
          }
          testImg.src = avatarUrl
        })
        
        try {
          const result = await loadPromise
          setImageSrc(result as string)
          setMethod('Direct Load')
          setError(false)
          setLoading(false)
          return
        } catch (err) {
          // Original failed, try optimized size variant
        }
        
        // Fallback: Try one optimized size variant (32px for small avatars)
        const optimizedUrl = avatarUrl.replace(/=s\d+/, '=s32')
        if (optimizedUrl !== avatarUrl) {
          const optimizedImg = new Image()
          optimizedImg.crossOrigin = 'anonymous'
          
          const optimizedTimeoutId = setTimeout(() => {
            optimizedImg.src = ''
          }, 2000)
          
          const optimizedPromise = new Promise((resolve, reject) => {
            optimizedImg.onload = () => {
              clearTimeout(optimizedTimeoutId)
              resolve(optimizedUrl)
            }
            optimizedImg.onerror = () => {
              clearTimeout(optimizedTimeoutId)
              reject(new Error('Optimized failed'))
            }
            optimizedImg.src = optimizedUrl
          })
          
          try {
            const result = await optimizedPromise
            setImageSrc(result as string)
            setMethod('Optimized Size')
            setError(false)
            setLoading(false)
            return
          } catch (err) {
            // Optimized also failed
          }
        }
        
        // All methods failed
        setError(true)
        setLoading(false)
        
      } catch (err) {
        setError(true)
        setLoading(false)
      }
    }

    loadAvatar()
  }, [avatarUrl])

  if (error) {
    return (
      <div className={`${className} bg-gradient-to-br from-blue-400 to-purple-400 rounded-full border-2 border-white/50 flex items-center justify-center`}>
        <span className="text-white font-bold text-sm">
          {alt.charAt(0).toUpperCase()}
        </span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`${className} bg-gradient-to-br from-blue-400 to-purple-400 rounded-full border-2 border-white/50 flex items-center justify-center`}>
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={`${className} rounded-full border-2 border-white/50 object-cover`}
      onError={() => {
        setError(true)
        setLoading(false)
      }}
    />
  )
}
