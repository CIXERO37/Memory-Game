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
                    <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl transform rotate-1 pixel-button-shadow"></div>
                    <Button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={isGoogleLoading}
                      aria-label="Sign in with Google"
                      className="group relative w-full h-12 sm:h-14 rounded-2xl bg-gradient-to-r from-[#ff512f] via-[#ff7043] to-[#dd2476] text-white border-2 sm:border-4 border-black shadow-[0_10px_30px_-5px_rgba(255,112,67,0.65)] hover:shadow-[0_18px_40px_-8px_rgba(221,36,118,0.75)] transition-all duration-300 pixel-button-host focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
                    >
                      {isGoogleLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-lg sm:text-xl font-bold">CONNECTING...</span>
                        </div>
                      ) : (
                        <>
                          <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.25),rgba(255,255,255,0)_45%)]" />
                          <div className="relative flex items-center justify-center gap-3 sm:gap-4">
                            <span className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/95 text-black shadow-inner ring-1 ring-black/10 group-hover:scale-105 transition-transform">
                              <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" aria-hidden="true">
                                <path fill="#EA4335" d="M12 11.9v3.84h5.39c-.24 1.23-1.62 3.6-5.39 3.6-3.25 0-5.9-2.7-5.9-6.04S8.75 7.26 12 7.26c1.85 0 3.09.79 3.79 1.47l2.58-2.49C17.06 4.8 14.76 3.9 12 3.9 6.96 3.9 2.9 7.96 2.9 13s4.06 9.1 9.1 9.1c5.25 0 8.7-3.68 8.7-8.86 0-.6-.06-1-.13-1.44H12z"/>
                                <path fill="#4285F4" d="M3.53 8.97l3.16 2.32C7.41 9.1 9.49 7.26 12 7.26c1.85 0 3.09.79 3.79 1.47l2.58-2.49C17.06 4.8 14.76 3.9 12 3.9 8.48 3.9 5.42 5.89 3.53 8.97z"/>
                                <path fill="#FBBC05" d="M12 22.1c2.94 0 5.42-.97 7.23-2.65l-3.43-2.67c-.93.63-2.13 1.07-3.8 1.07-3.03 0-5.59-2.04-6.51-4.81l-3.19 2.46C4.26 19.44 7.83 22.1 12 22.1z"/>
                                <path fill="#34A853" d="M5.69 13.04c-.21-.63-.32-1.3-.32-2 0-.7.11-1.37.32-2L2.5 6.58C1.79 8 1.4 9.57 1.4 11.26s.39 3.26 1.1 4.68l3.19-2.9z"/>
                              </svg>
                            </span>
                            <span className="text-base sm:text-xl font-extrabold tracking-wide drop-shadow-[0_1px_0_rgba(0,0,0,0.35)]">
                              Sign in with Google
                            </span>
                          </div>
                        </>
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
