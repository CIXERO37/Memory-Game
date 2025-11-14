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

  useEffect(() => {
    if (!avatarUrl || !avatarUrl.trim()) {
      setError(true)
      setLoading(false)
      return
    }

    const loadAvatar = async () => {
      const methods = []
      
      // Method 1: Try original URL without CORS restriction
      methods.push({
        name: 'Direct',
        url: avatarUrl,
        crossOrigin: false
      })
      
      // Method 2: Try original URL with CORS
      methods.push({
        name: 'Direct CORS',
        url: avatarUrl,
        crossOrigin: true
      })
      
      // Method 3: Try optimized size variants for Google Photos URLs
      if (avatarUrl.includes('googleusercontent.com')) {
        // Try different size parameters
        const sizes = [64, 96, 128, 256]
        for (const size of sizes) {
          if (avatarUrl.includes('=s')) {
            methods.push({
              name: `Size ${size}`,
              url: avatarUrl.replace(/=s\d+/, `=s${size}`),
              crossOrigin: false
            })
          } else {
            methods.push({
              name: `Size ${size}`,
              url: `${avatarUrl}${avatarUrl.includes('?') ? '&' : '?'}sz=${size}`,
              crossOrigin: false
            })
          }
        }
        
        // Try removing size parameter entirely
        if (avatarUrl.includes('=s')) {
          methods.push({
            name: 'No size param',
            url: avatarUrl.replace(/[?&]s=\d+/, ''),
            crossOrigin: false
          })
        }
      }
      
      // Try each method
      for (const method of methods) {
        try {
          const success = await new Promise<boolean>((resolve) => {
            const testImg = new Image()
            let resolved = false
            
            // Set timeout
            const timeoutId = setTimeout(() => {
              if (!resolved) {
                resolved = true
                testImg.onload = null
                testImg.onerror = null
                testImg.src = ''
                resolve(false)
              }
            }, 3000) // 3 second timeout
            
            testImg.onload = () => {
              if (!resolved) {
                resolved = true
                clearTimeout(timeoutId)
                setImageSrc(method.url)
                setError(false)
                setLoading(false)
                resolve(true)
              }
            }
            
            testImg.onerror = () => {
              if (!resolved) {
                resolved = true
                clearTimeout(timeoutId)
                resolve(false)
              }
            }
            
            // Try with or without CORS
            if (method.crossOrigin) {
              testImg.crossOrigin = 'anonymous'
            } else {
              // Remove crossOrigin attribute if not needed
              testImg.removeAttribute('crossorigin')
            }
            
            // Set referrerPolicy to no-referrer to avoid CORS issues
            testImg.referrerPolicy = 'no-referrer'
            
            testImg.src = method.url
          })
          
          if (success) {
            return // Successfully loaded
          }
        } catch (err) {
          // Continue to next method
          continue
        }
      }
      
      // If all methods failed, try one more time with direct img tag approach
      // This is a last resort - just use the URL directly and let the browser handle it
      setImageSrc(avatarUrl)
      setError(false)
      setLoading(false)
    }

    loadAvatar()
  }, [avatarUrl])

  if (error && !imageSrc) {
    return (
      <div className={`${className} bg-gradient-to-br from-blue-400 to-purple-400 rounded-full border-2 border-white/50 flex items-center justify-center`} style={{ width, height }}>
        <span className="text-white font-bold text-sm">
          {alt.charAt(0).toUpperCase()}
        </span>
      </div>
    )
  }

  if (loading && !imageSrc) {
    return (
      <div className={`${className} bg-gradient-to-br from-blue-400 to-purple-400 rounded-full border-2 border-white/50 flex items-center justify-center`} style={{ width, height }}>
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <img
      src={imageSrc || avatarUrl}
      alt={alt}
      width={width}
      height={height}
      className={`${className} rounded-full border-2 border-white/50 object-cover`}
      style={{ width, height }}
      referrerPolicy="no-referrer"
      onError={() => {
        setError(true)
        setLoading(false)
        setImageSrc('')
      }}
      onLoad={() => {
        setError(false)
        setLoading(false)
      }}
    />
  )
}
