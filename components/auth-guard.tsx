"use client"

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Routes that don't require authentication
  const publicRoutes = ['/login', '/auth/callback']
  const isPublicRoute = publicRoutes.includes(pathname)

  // Check if this is a join route with possible room code (supports /join and /join/<code>)
  const isJoinRoute = pathname.startsWith('/join')
  const getRoomCodeFromUrl = (): string | null => {
    if (typeof window === 'undefined') return null
    const qsCode = new URLSearchParams(window.location.search).get('room')
    if (qsCode) return qsCode
    // Try to extract from path /join/<code>
    try {
      const parts = pathname.split('/').filter(Boolean)
      if (parts[0] === 'join' && parts[1] && /^[A-Z0-9]{6}$/i.test(parts[1])) {
        return parts[1].toUpperCase()
      }
    } catch { }
    return null
  }
  const hasRoomCode = !!getRoomCodeFromUrl()

  useEffect(() => {
    // Don't redirect if still loading
    if (loading) return

    // If not authenticated and not on a public route, redirect to login
    if (!isAuthenticated && !isPublicRoute) {


      // If this is a join route with room code, preserve the room code in the redirect
      if (isJoinRoute && hasRoomCode) {
        const roomCode = getRoomCodeFromUrl()


        // Store the redirect URL in sessionStorage for later use
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('pendingRedirect', `/join?room=${roomCode}`)
        }

        router.push(`/login?redirect=/join&room=${roomCode}`)
      } else {
        router.push('/login')
      }
    }

    // If authenticated and on login page with redirect parameters, redirect to target
    if (isAuthenticated && pathname === '/login') {
      const urlParams = new URLSearchParams(window.location.search)
      const redirectPath = urlParams.get('redirect')
      const roomCode = urlParams.get('room')

      if (redirectPath === '/join' && roomCode) {

        router.push(`/join?room=${roomCode}`)
      } else {

        router.push('/')
      }
    }

    // If authenticated and on join page without room code, but there's a redirect parameter in session
    if (isAuthenticated && pathname.startsWith('/join') && !hasRoomCode) {
      // Check if there's a stored redirect in sessionStorage or localStorage
      if (typeof window !== 'undefined') {
        const storedRedirect = sessionStorage.getItem('pendingRedirect')
        if (storedRedirect) {

          sessionStorage.removeItem('pendingRedirect')
          router.push(storedRedirect)
        }
      }
    }

    // If authenticated and on any page, check if there's a pending redirect
    if (isAuthenticated && typeof window !== 'undefined') {
      const storedRedirect = sessionStorage.getItem('pendingRedirect')
      if (storedRedirect && pathname !== '/join') {

        sessionStorage.removeItem('pendingRedirect')
        router.push(storedRedirect)
      }
    }
  }, [isAuthenticated, loading, isPublicRoute, router, pathname, isJoinRoute, hasRoomCode])

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-bold text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  // If not authenticated and not on a public route, don't render children
  if (!isAuthenticated && !isPublicRoute) {
    return null
  }

  // Render children for authenticated users or public routes
  return <>{children}</>
}
