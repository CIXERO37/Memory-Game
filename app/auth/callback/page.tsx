"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('Processing authentication...')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('=== Auth Callback Debug ===')
        console.log('URL search params:', searchParams.toString())
        
        // Check for error in URL params
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        if (error) {
          console.error('OAuth error:', error, errorDescription)
          setStatus('Authentication failed. Redirecting...')
          
          // If error is about database, it means user IS authenticated but profile creation failed
          // This is OK - we can still proceed
          if (errorDescription?.includes('Database error')) {
            console.log('Database error detected, but user might be authenticated. Checking session...')
            // Continue to check session instead of failing immediately
          } else {
            // For other errors, redirect to login
            setTimeout(() => router.push('/login?error=auth_failed'), 1500)
            return
          }
        }
        
        setStatus('Verifying your session...')
        
        // Handle OAuth callback - exchange code for session
        const { data, error: sessionError } = await supabase.auth.getSession()
        
        console.log('Session data:', data)
        console.log('Session error:', sessionError)
        
        if (sessionError) {
          console.error('Auth callback error:', sessionError)
          setStatus('Session error. Redirecting...')
          setTimeout(() => router.push('/login?error=auth_failed'), 1500)
          return
        }

        if (data.session) {
          console.log('✅ Auth callback successful!')
          console.log('User:', data.session.user.email)
          console.log('User metadata:', data.session.user.user_metadata)
          
          setStatus('Login successful! Redirecting...')
          
          // Check if there's a redirect URL with room code in the URL params
          const redirectPath = searchParams.get('redirect')
          const roomCode = searchParams.get('room')
          
          // Store redirect in sessionStorage if available
          if (redirectPath === '/join' && roomCode) {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('pendingRedirect', `/join?room=${roomCode}`)
              console.log('Stored pending redirect:', `/join?room=${roomCode}`)
            }
          }
          
          // Wait a bit to ensure session is fully established
          setTimeout(() => {
            if (redirectPath === '/join' && roomCode) {
              console.log('Redirecting to join page with room code:', roomCode)
              // Force redirect to join page with room code
              window.location.href = `/join?room=${roomCode}`
            } else {
              router.push('/')
            }
            router.refresh() // Force refresh to update auth state
          }, 500)
        } else {
          console.log('No session found immediately, waiting for auth state change...')
          setStatus('Finalizing login...')
          
          // Listen for auth state change in case session is still being processed
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              console.log('Auth state change event:', event)
              console.log('Auth state change session:', session?.user?.email)
              
              if (event === 'SIGNED_IN' && session) {
                console.log('✅ User signed in successfully via state change')
                setStatus('Login successful! Redirecting...')
                
                // Check if there's a redirect URL with room code in the URL params
                const redirectPath = searchParams.get('redirect')
                const roomCode = searchParams.get('room')
                
                // Store redirect in sessionStorage if available
                if (redirectPath === '/join' && roomCode) {
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('pendingRedirect', `/join?room=${roomCode}`)
                    console.log('Stored pending redirect in state change:', `/join?room=${roomCode}`)
                  }
                }
                
                setTimeout(() => {
                  if (redirectPath === '/join' && roomCode) {
                    console.log('Redirecting to join page with room code:', roomCode)
                    // Force redirect to join page with room code
                    window.location.href = `/join?room=${roomCode}`
                  } else {
                    router.push('/')
                  }
                  router.refresh()
                  subscription.unsubscribe()
                }, 500)
              } else if (event === 'SIGNED_OUT') {
                console.log('User signed out, redirecting to login')
                setStatus('Session ended. Redirecting...')
                setTimeout(() => {
                  router.push('/login')
                  subscription.unsubscribe()
                }, 1000)
              }
            }
          )
          
          // Set a longer timeout to give more time for session establishment
          setTimeout(() => {
            subscription.unsubscribe()
            if (!data.session) {
              console.log('Timeout reached without session, redirecting to login')
              setStatus('Login timeout. Redirecting...')
              setTimeout(() => router.push('/login?error=timeout'), 1000)
            }
          }, 8000) // Increased from 5s to 8s
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        setStatus('An error occurred. Redirecting...')
        setTimeout(() => router.push('/login?error=auth_failed'), 1500)
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white font-bold text-lg">{status}</p>
        <p className="text-white/70 text-sm mt-2">Please wait while we complete your login</p>
      </div>
    </div>
  )
}
