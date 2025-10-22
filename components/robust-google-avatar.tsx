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
        // Method 1: Try with different Google avatar sizes
        const googleAvatarVariants = [
          avatarUrl,
          avatarUrl.replace(/=s\d+/, '=s96'), // Force 96px size
          avatarUrl.replace(/=s\d+/, '=s64'), // Force 64px size
          avatarUrl.replace(/=s\d+/, '=s32'), // Force 32px size
          avatarUrl + '?sz=96', // Add size parameter
        ]

        for (let i = 0; i < googleAvatarVariants.length; i++) {
          const variant = googleAvatarVariants[i]
          
          try {
            // Test if the image can be loaded
            const testImg = new Image()
            testImg.crossOrigin = 'anonymous'
            
            const loadPromise = new Promise((resolve, reject) => {
              testImg.onload = () => resolve(variant)
              testImg.onerror = () => reject(new Error('Failed to load'))
              testImg.src = variant
            })
            
            const result = await loadPromise
            setImageSrc(result as string)
            setMethod(`Google Variant ${i + 1}`)
            setError(false)
            setLoading(false)
            return
            
          } catch (err) {
            continue
          }
        }
        
        // Method 2: Try fetch with different approaches
        
        try {
          const response = await fetch(avatarUrl, {
            method: 'GET',
            mode: 'cors',
            credentials: 'omit',
            headers: {
              'Accept': 'image/*',
            }
          })
          
          if (response.ok) {
            const blob = await response.blob()
            const imageUrl = URL.createObjectURL(blob)
            setImageSrc(imageUrl)
            setMethod('Fetch Method')
            setError(false)
            setLoading(false)
            return
          }
        } catch (fetchErr) {
          // Continue to next method
        }
        
        // Method 3: Try with proxy
        const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(avatarUrl)}`
        
        try {
          const proxyImg = new Image()
          proxyImg.crossOrigin = 'anonymous'
          
          const proxyPromise = new Promise((resolve, reject) => {
            proxyImg.onload = () => resolve(proxyUrl)
            proxyImg.onerror = () => reject(new Error('Proxy failed'))
            proxyImg.src = proxyUrl
          })
          
          await proxyPromise
          setImageSrc(proxyUrl)
          setMethod('Proxy Method')
          setError(false)
          setLoading(false)
          return
          
        } catch (proxyErr) {
          // All methods failed
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
