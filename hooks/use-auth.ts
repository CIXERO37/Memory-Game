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
}

// Cache key for localStorage
const PROFILE_CACHE_KEY = 'user_profile_cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

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
        console.log('Getting initial session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting initial session:', error)
          setLoading(false)
        } else if (session?.user) {
          console.log('Initial session found:', session.user.email)
          setUser(session.user)
          
          // Create profile from metadata FIRST (instant, non-blocking)
          const quickProfile = createUserProfile(session.user)
          setUserProfile(quickProfile)
          setLoading(false) // Set loading false immediately for fast render
          
          // Check cache first before making database request
          const cachedProfile = getCachedProfile(session.user.id)
          if (cachedProfile) {
            // Use cached profile if it's different from quick profile
            if (cachedProfile.username !== quickProfile.username || 
                cachedProfile.avatar_url !== quickProfile.avatar_url ||
                cachedProfile.name !== quickProfile.name) {
              console.log('Using cached profile:', cachedProfile)
              setUserProfile(cachedProfile)
            }
            // Cache is still valid, skip database request
            return
          }
          
          // Only fetch from database if metadata doesn't have sufficient info
          // or if cache is missing/expired
          const needsDatabaseFetch = !quickProfile.avatar_url || !quickProfile.name || !quickProfile.username
          
          if (needsDatabaseFetch) {
            // Then fetch from database in background (non-blocking)
            createUserProfileWithDatabase(session.user)
              .then(enhancedProfile => {
                // Cache the enhanced profile
                cacheProfile(session.user.id, enhancedProfile)
                
                // Only update if different (to avoid unnecessary re-renders)
                if (enhancedProfile.username !== quickProfile.username || 
                    enhancedProfile.avatar_url !== quickProfile.avatar_url ||
                    enhancedProfile.name !== quickProfile.name) {
                  console.log('Updating profile from database:', enhancedProfile)
                  setUserProfile(enhancedProfile)
                }
              })
              .catch(() => {
                // Already have quickProfile, so ignore errors silently
              })
          } else {
            // Metadata has sufficient info, cache it
            cacheProfile(session.user.id, quickProfile)
          }
        } else {
          console.log('No initial session found')
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
        console.log('Auth state change:', event, session?.user?.email)
        
        if (session?.user) {
          setUser(session.user)
          
          // Use quick profile first, then enhance from database
          const quickProfile = createUserProfile(session.user)
          setUserProfile(quickProfile)
          setLoading(false) // Set loading false immediately
          
          // Check cache first
          const cachedProfile = getCachedProfile(session.user.id)
          if (cachedProfile) {
            if (cachedProfile.username !== quickProfile.username || 
                cachedProfile.avatar_url !== quickProfile.avatar_url ||
                cachedProfile.name !== quickProfile.name) {
              setUserProfile(cachedProfile)
            }
            return
          }
          
          // Only fetch if needed
          const needsDatabaseFetch = !quickProfile.avatar_url || !quickProfile.name || !quickProfile.username
          
          if (needsDatabaseFetch) {
            // Enhance from database in background (non-blocking)
            createUserProfileWithDatabase(session.user)
              .then(enhancedProfile => {
                cacheProfile(session.user.id, enhancedProfile)
                if (enhancedProfile.username !== quickProfile.username || 
                    enhancedProfile.avatar_url !== quickProfile.avatar_url ||
                    enhancedProfile.name !== quickProfile.name) {
                  console.log('Updating profile from database:', enhancedProfile)
                  setUserProfile(enhancedProfile)
                }
              })
              .catch(() => {
                // Ignore errors, already have quickProfile
              })
          } else {
            cacheProfile(session.user.id, quickProfile)
          }
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

  return {
    user,
    userProfile,
    loading,
    logout,
    showLogoutDialog,
    cancelLogout,
    showLogoutConfirmation,
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
      // Try to fetch from users_profile table with timeout
      // This prevents blocking if database is slow
      const queryPromise = supabase
        .from('users_profile')
        // Some schemas use `full_name`, others use `fullname` — request both
        .select('username, full_name, fullname, avatar_url')
        .eq('id', user.id)
        .single()
      
      // Add timeout to prevent blocking (reduced to 1.5s for faster failure)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 1500)
      )
      
      const result = await Promise.race([
        queryPromise,
        timeoutPromise
      ]) as Awaited<typeof queryPromise>
      
      const { data: profileData, error } = result
      
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

        // If username still empty, try to derive from full_name/fullname
        if (!username && profileData.full_name) {
          username = profileData.full_name
        } else if (!username && (profileData as any).fullname) {
          username = (profileData as any).fullname
        }
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
      username
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
    username
  }
}
