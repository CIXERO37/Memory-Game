"use client"

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface UserProfile {
  id: string
  email: string
  name: string
  avatar_url?: string
  username: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false)

  useEffect(() => {
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
          
          // Then fetch from database in background (non-blocking)
          // This updates the profile if database has different/better data
          createUserProfileWithDatabase(session.user)
            .then(enhancedProfile => {
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
          
          // Enhance from database in background (non-blocking)
          createUserProfileWithDatabase(session.user)
            .then(enhancedProfile => {
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
          setUser(null)
          setUserProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
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
async function createUserProfileWithDatabase(user: User): Promise<UserProfile> {
  const email = user.email || ''
  const name = user.user_metadata?.full_name || user.user_metadata?.name || ''
  
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
  
  try {
    // Try to fetch from users_profile table with timeout
    // This prevents blocking if database is slow
    const queryPromise = supabase
      .from('users_profile')
      .select('username, full_name, avatar_url')
      .eq('id', user.id)
      .single()
    
    // Add timeout to prevent blocking
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout')), 2000)
    )
    
    const result = await Promise.race([
      queryPromise,
      timeoutPromise
    ]) as Awaited<typeof queryPromise>
    
    const { data: profileData, error } = result
    
    if (!error && profileData) {
      // Use username from database if available
      if (profileData.username) {
        username = profileData.username
      }
      // Use avatar from database if available
      if (profileData.avatar_url) {
        avatar_url = profileData.avatar_url
      }
      // Use full_name from database if available and name is empty
      if (!name && profileData.full_name) {
        const nameFromDb = profileData.full_name
        if (!username) {
          username = nameFromDb
        }
      }
    }
  } catch (error) {
    // Silently fail - we already have username from metadata
    // This is expected if database is slow or unavailable
    console.warn('Database fetch failed or timed out, using metadata')
  }

  return {
    id: user.id,
    email,
    name: name || username, // Use name from metadata or username as fallback
    avatar_url,
    username
  }
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
