"use client"

import { useState, useEffect, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface UserProfile {
  id: string
  email: string
  name: string
  avatar_url?: string
  username: string
  nickname?: string
}

// Cache key for localStorage
const PROFILE_CACHE_KEY = 'user_profile_cache'
const CACHE_DURATION = 30 * 1000 // 30 seconds (reduced for better sync)

// Request deduplication - prevent multiple simultaneous requests
const pendingProfileRequests = new Map<string, Promise<UserProfile>>()

// Cache interface
interface CachedProfile {
  profile: UserProfile
  timestamp: number
  userId: string
}

// Get cached profile
function getCachedProfile(userId: string): UserProfile | null {
  try {
    const cached = localStorage.getItem(PROFILE_CACHE_KEY)
    if (!cached) return null

    const { profile, timestamp, userId: cachedUserId }: CachedProfile = JSON.parse(cached)

    // Check if cache is for same user and still valid
    if (cachedUserId === userId && Date.now() - timestamp < CACHE_DURATION) {
      return profile
    }

    // Cache expired or different user, clear it
    localStorage.removeItem(PROFILE_CACHE_KEY)
    return null
  } catch {
    return null
  }
}

// Save profile to cache
function cacheProfile(userId: string, profile: UserProfile): void {
  try {
    const cached: CachedProfile = {
      profile,
      timestamp: Date.now(),
      userId
    }
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cached))
  } catch {
    // Ignore storage errors
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false)
  const initializedRef = useRef(false)

  useEffect(() => {
    // Prevent multiple initializations
    if (initializedRef.current) return
    initializedRef.current = true

    // Get initial session
    const getInitialSession = async () => {
      try {

        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Error getting initial session:', error)
          setLoading(false)
        } else if (session?.user) {

          setUser(session.user)

          // Siapkan quick profile dari OAuth sebagai fallback saja
          const quickProfile = createUserProfile(session.user)

          // Prioritaskan data dari database (profiles table)
          createUserProfileWithDatabase(session.user)
            .then(enhancedProfile => {
              // Cache dan gunakan profile dari database sebagai sumber utama
              cacheProfile(session.user.id, enhancedProfile)

              setUserProfile(enhancedProfile)
            })
            .catch(() => {
              // Jika query database gagal / tidak ada row, baru pakai metadata OAuth
              console.warn('Database fetch failed on initial load, using metadata profile')
              cacheProfile(session.user.id, quickProfile)
              setUserProfile(quickProfile)
            })
            .finally(() => {
              setLoading(false)
            })
        } else {

          setLoading(false)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {


        if (session?.user) {
          setUser(session.user)

          // Siapkan quick profile dari OAuth sebagai fallback
          const quickProfile = createUserProfile(session.user)

          // Selalu coba ambil dari database dulu
          createUserProfileWithDatabase(session.user)
            .then(enhancedProfile => {
              cacheProfile(session.user.id, enhancedProfile)

              setUserProfile(enhancedProfile)
            })
            .catch(() => {
              console.warn('Database fetch failed on auth change, using metadata profile')
              cacheProfile(session.user.id, quickProfile)
              setUserProfile(prev => prev ?? quickProfile)
            })
            .finally(() => {
              setLoading(false)
            })
        } else {
          setUser(null)
          setUserProfile(null)
          setLoading(false)
          // Clear cache on logout
          localStorage.removeItem(PROFILE_CACHE_KEY)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
      initializedRef.current = false
    }
  }, [])

  const logout = async () => {
    try {
      await supabase.auth.signOut()
      setShowLogoutConfirmation(false)
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const showLogoutDialog = () => {
    setShowLogoutConfirmation(true)
  }

  const cancelLogout = () => {
    setShowLogoutConfirmation(false)
  }

  const refreshProfile = async () => {
    if (!user) return

    try {

      // Clear cache to force fresh data
      localStorage.removeItem(PROFILE_CACHE_KEY)

      // Fetch fresh profile from database
      const enhancedProfile = await createUserProfileWithDatabase(user)
      cacheProfile(user.id, enhancedProfile)
      setUserProfile(enhancedProfile)

    } catch (error) {
      console.error('Error refreshing profile:', error)
    }
  }

  return {
    user,
    userProfile,
    loading,
    logout,
    showLogoutDialog,
    cancelLogout,
    showLogoutConfirmation,
    refreshProfile,
    isAuthenticated: !!user
  }
}

// Helper function to create user profile, with database fallback (with timeout)
// Uses request deduplication to prevent multiple simultaneous requests
async function createUserProfileWithDatabase(user: User): Promise<UserProfile> {
  // Check if there's already a pending request for this user
  const existingRequest = pendingProfileRequests.get(user.id)
  if (existingRequest) {
    return existingRequest
  }

  const email = user.email || ''
  // Prefer Google metadata name fields initially; will be overridden by DB if available
  let name = user.user_metadata?.full_name || user.user_metadata?.name || ''

  // Start with metadata values (fast fallback)
  let username = ''
  let avatar_url = user.user_metadata?.avatar_url
  let nickname: string | undefined = undefined

  // Extract username from metadata first (as fallback)
  if (name && name.trim()) {
    username = name.trim()
  } else if (email.includes('@gmail.com')) {
    username = email.split('@')[0]
  } else {
    username = email.split('@')[0]
  }

  // Create the request promise
  const requestPromise = (async () => {
    try {
      // Try to fetch from profiles table with timeout
      // This prevents blocking if database is slow
      // Note: profiles table structure may vary - try both id and auth_user_id
      let profileData = null
      let error = null

      // First try with id (direct reference to auth.users(id) - from migration script)
      try {
        const queryPromise1 = supabase
          .from('profiles')
          // Select all columns so we don't break on schema differences (full_name vs fullname, etc.)
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database query timeout')), 1500)
        )

        const result1 = await Promise.race([
          queryPromise1,
          timeoutPromise
        ]) as Awaited<typeof queryPromise1>

        if (!result1.error && result1.data) {
          profileData = result1.data

        } else {
          error = result1.error


          // Fallback: try with auth_user_id (if table structure uses separate column)
          const queryPromise2 = supabase
            .from('profiles')
            .select('*')
            .eq('auth_user_id', user.id)
            .maybeSingle()

          const result2 = await Promise.race([
            queryPromise2,
            timeoutPromise
          ]) as Awaited<typeof queryPromise2>

          if (!result2.error && result2.data) {
            profileData = result2.data

          } else {
            error = result2.error

          }
        }
      } catch (err) {
        console.warn('[useAuth] Query exception:', err)
        error = err as any
      }



      if (!error && profileData) {
        // Prefer database full_name/fullname as authoritative name when present
        if (profileData.full_name) {
          name = profileData.full_name

        } else if ((profileData as any).fullname) {
          // some deployments use `fullname` column
          name = (profileData as any).fullname

        }

        // Use username from database if available (fallback for display names)
        if (profileData.username) {
          username = profileData.username

        }

        // Use avatar from database if available; otherwise keep Google avatar
        if (profileData.avatar_url) {
          avatar_url = profileData.avatar_url

        }

        // Extract nickname
        // Extract nickname
        if ((profileData as any).nickname) {
          nickname = (profileData as any).nickname
        }

        // If username still empty, try to derive from full_name/fullname
        if (!username && profileData.full_name) {
          username = profileData.full_name
        } else if (!username && (profileData as any).fullname) {
          username = (profileData as any).fullname
        }
      } else if (error) {
        console.warn('[useAuth] Error fetching profile from database:', error)
      } else {
        console.warn('[useAuth] No profile data found in database for user:', user.id)
      }
    } catch (error) {
      // Silently fail - we already have username from metadata
      // This is expected if database is slow or unavailable
      console.warn('Database fetch failed or timed out, using metadata')
    } finally {
      // Remove from pending requests after completion
      pendingProfileRequests.delete(user.id)
    }

    return {
      id: user.id,
      email,
      name: name || username, // prefer DB full_name or Google metadata name, fallback to username
      avatar_url,
      username,
      nickname
    }
  })()

  // Store the pending request
  pendingProfileRequests.set(user.id, requestPromise)

  return requestPromise
}

// Legacy function for backward compatibility
function createUserProfile(user: User): UserProfile {
  const email = user.email || ''
  const name = user.user_metadata?.full_name || user.user_metadata?.name || ''

  // Extract username - prioritize Google display name over email
  let username = ''
  if (name && name.trim()) {
    // Use Google display name if available
    username = name.trim()
  } else if (email.includes('@gmail.com')) {
    // For Gmail, use the part before @gmail.com
    username = email.split('@')[0]
  } else {
    // For other email accounts, use the part before @
    username = email.split('@')[0]
  }

  return {
    id: user.id,
    email,
    name,
    avatar_url: user.user_metadata?.avatar_url,
    username,
    nickname: undefined
  }
}
