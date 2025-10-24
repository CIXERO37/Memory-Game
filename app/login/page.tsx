"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, LogIn, Eye, EyeOff, Mail, Lock, Brain } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  // Redirect logic is now handled by AuthGuard

  // Handle error parameters from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const error = urlParams.get('error')
    
    if (error === 'auth_failed') {
      setErrors({ general: "Authentication failed. Please try again." })
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }))
    }
  }

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}
    
    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email"
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsLoading(true)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })
      
      if (error) {
        console.error("Login error:", error)
        setErrors({ general: "Invalid email or password. Please try again." })
      } else if (data.user) {
        // Successfully logged in, redirect will happen via useEffect
        console.log("Login successful:", data.user)
      }
    } catch (error) {
      console.error("Login error:", error)
      setErrors({ general: "An error occurred during login. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    
    try {
      // Force production URL detection - more robust approach
      const currentOrigin = window.location.origin
      const isLocalhost = currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')
      
      // Use environment variable if available, otherwise use current origin
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || currentOrigin
      
      // Check for redirect parameters
      const urlParams = new URLSearchParams(window.location.search)
      const redirectPath = urlParams.get('redirect')
      const roomCode = urlParams.get('room')
      
      // Build redirect URL with parameters if they exist
      let redirectUrl = `${siteUrl}/auth/callback`
      if (redirectPath && roomCode) {
        redirectUrl += `?redirect=${redirectPath}&room=${roomCode}`
      }
      
      console.log('=== Google OAuth Debug Info ===')
      console.log('Current origin:', currentOrigin)
      console.log('Is localhost:', isLocalhost)
      console.log('Site URL from env:', process.env.NEXT_PUBLIC_SITE_URL)
      console.log('Redirect path:', redirectPath)
      console.log('Room code:', roomCode)
      console.log('Final redirect URL:', redirectUrl)
      console.log('================================')
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      })
      
      if (error) {
        console.error("Google login error:", error)
        setErrors({ general: "Failed to login with Google. Please try again." })
      }
    } catch (error) {
      console.error("Google login error:", error)
      setErrors({ general: "Failed to login with Google. Please try again." })
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
      {/* Pixel Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="pixel-grid"></div>
      </div>
      
      {/* Retro Scanlines */}
      <div className="absolute inset-0 opacity-10">
        <div className="scanlines"></div>
      </div>
      
      {/* Floating Pixel Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <PixelBackgroundElements />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-4 sm:py-8 min-h-screen flex flex-col justify-center">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-4 mb-6 sm:mb-8">
         
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-500 border-2 border-black rounded flex items-center justify-center">
              <LogIn className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="inline-block bg-white border-2 border-black rounded px-2 sm:px-3 py-1 sm:py-2 pixel-header-title">
              <h1 className="text-lg sm:text-xl font-bold text-black">LOGIN</h1>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="max-w-md mx-auto w-full">
          <div className="relative pixel-button-container">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
            <div className="relative bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg border-4 border-black shadow-2xl p-6 sm:p-8">
              {/* Brain Icon */}
              <div className="text-center mb-6">
                <div className="relative inline-block pixel-logo-container">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto relative pixel-brain">
                    <div className="absolute inset-0 bg-gradient-to-r from-white to-gray-200 rounded-lg opacity-20 blur-lg animate-pulse"></div>
                    <div className="relative w-full h-full bg-gradient-to-r from-white to-gray-200 rounded-lg border-2 sm:border-4 border-black shadow-2xl flex items-center justify-center">
                      <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-black" />
                    </div>
                  </div>
                </div>
            
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Google Login Button */}
                <div className="pb-4">
                  <div className="relative pixel-button-container">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                    <Button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={isGoogleLoading}
                      className="relative w-full h-12 sm:h-14 bg-gradient-to-br from-red-500 to-orange-500 border-2 sm:border-4 border-black rounded-lg shadow-2xl font-bold text-white text-lg sm:text-xl pixel-button-host transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isGoogleLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-lg sm:text-xl font-bold">CONNECTING...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 sm:gap-4">
                          <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          <span className="text-lg sm:text-xl font-bold">GOOGLE</span>
                        </div>
                      )}
                    </Button>
                  </div>
                  {/* Google Error Message */}
                  {errors.general && (
                    <div className="pt-2">
                      <p className="text-red-400 text-xs font-bold pixel-font-sm text-center">{errors.general}</p>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4 pb-4">
                  <div className="flex-1 h-px bg-white/30"></div>
                  <span className="text-white/70 font-bold text-sm">OR</span>
                  <div className="flex-1 h-px bg-white/30"></div>
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <div className="inline-block bg-white border border-black rounded px-2 py-1">
                    <label className="text-black font-bold text-xs sm:text-sm">EMAIL</label>
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 border border-black rounded flex items-center justify-center">
                      <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                    </div>
                    <Input
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`pl-10 sm:pl-12 h-10 sm:h-12 bg-white border-2 border-black rounded-none shadow-lg font-mono text-sm sm:text-base text-black placeholder:text-gray-500 focus:border-blue-600 ${
                        errors.email ? 'border-red-500' : ''
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-400 text-xs font-bold pixel-font-sm">{errors.email}</p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="inline-block bg-white border border-black rounded px-2 py-1">
                    <label className="text-black font-bold text-xs sm:text-sm">PASSWORD</label>
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 border border-black rounded flex items-center justify-center">
                      <Lock className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                    </div>
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`pl-10 sm:pl-12 pr-10 sm:pr-12 h-10 sm:h-12 bg-white border-2 border-black rounded-none shadow-lg font-mono text-sm sm:text-base text-black placeholder:text-gray-500 focus:border-blue-600 ${
                        errors.password ? 'border-red-500' : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 bg-gray-500 border border-black rounded flex items-center justify-center hover:bg-gray-400 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      ) : (
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-xs font-bold pixel-font-sm">{errors.password}</p>
                  )}
                </div>

                {/* Login Button */}
                <div className="pt-4">
                  <div className="relative pixel-button-container">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="relative w-full h-12 sm:h-14 bg-gradient-to-br from-green-500 to-emerald-500 border-2 sm:border-4 border-black rounded-lg shadow-2xl font-bold text-black text-lg sm:text-xl pixel-button-host transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-lg sm:text-xl font-bold">LOGGING IN...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 sm:gap-4">
                         
                          <span className="text-lg sm:text-xl font-bold">LOGIN</span>
                        </div>
                      )}
                    </Button>
                  </div>
                  {/* General Error Message */}
                  {errors.general && (
                    <div className="pt-2">
                      <p className="text-red-400 text-xs font-bold pixel-font-sm text-center">{errors.general}</p>
                    </div>
                  )}
                </div>

             
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PixelBackgroundElements() {
  const pixels = [
    { id: 1, color: 'bg-red-500', size: 'w-2 h-2', delay: '0s', duration: '3s', x: '10%', y: '20%' },
    { id: 2, color: 'bg-blue-500', size: 'w-3 h-3', delay: '1s', duration: '4s', x: '80%', y: '30%' },
    { id: 3, color: 'bg-green-500', size: 'w-2 h-2', delay: '2s', duration: '3.5s', x: '20%', y: '70%' },
    { id: 4, color: 'bg-yellow-500', size: 'w-4 h-4', delay: '0.5s', duration: '5s', x: '70%', y: '10%' },
    { id: 5, color: 'bg-purple-500', size: 'w-2 h-2', delay: '1.5s', duration: '4.5s', x: '50%', y: '80%' },
    { id: 6, color: 'bg-pink-500', size: 'w-3 h-3', delay: '2.5s', duration: '3s', x: '30%', y: '50%' },
    { id: 7, color: 'bg-cyan-500', size: 'w-2 h-2', delay: '0.8s', duration: '4s', x: '90%', y: '60%' },
    { id: 8, color: 'bg-orange-500', size: 'w-3 h-3', delay: '1.8s', duration: '3.8s', x: '15%', y: '40%' },
    { id: 9, color: 'bg-lime-500', size: 'w-2 h-2', delay: '2.2s', duration: '4.2s', x: '60%', y: '25%' },
    { id: 10, color: 'bg-indigo-500', size: 'w-4 h-4', delay: '0.3s', duration: '5.5s', x: '85%', y: '75%' },
  ]

  return (
    <>
      {pixels.map((pixel) => (
        <div
          key={pixel.id}
          className={`absolute ${pixel.color} ${pixel.size} pixel-float`}
          style={{
            left: pixel.x,
            top: pixel.y,
            animationDelay: pixel.delay,
            animationDuration: pixel.duration,
          }}
        />
      ))}
      
      {/* Floating Pixel Blocks */}
      <div className="absolute top-20 left-10 w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-400 opacity-30 pixel-block-float">
        <div className="w-full h-full border-2 border-white/50"></div>
      </div>
      <div className="absolute top-40 right-20 w-12 h-12 bg-gradient-to-br from-green-400 to-cyan-400 opacity-40 pixel-block-float-delayed">
        <div className="w-full h-full border-2 border-white/50"></div>
      </div>
      <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-br from-red-400 to-pink-400 opacity-35 pixel-block-float-slow">
        <div className="w-full h-full border-2 border-white/50"></div>
      </div>
      <div className="absolute bottom-20 right-1/3 w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-400 opacity-45 pixel-block-float-delayed-slow">
        <div className="w-full h-full border-2 border-white/50"></div>
      </div>
    </>
  )
}
