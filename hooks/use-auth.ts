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
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          setUserProfile(createUserProfile(session.user))
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          setUserProfile(createUserProfile(session.user))
        } else {
          setUser(null)
          setUserProfile(null)
        }
        setLoading(false)
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
