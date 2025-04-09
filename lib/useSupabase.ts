import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// Type definitions
export type User = {
  id: string
  email?: string
}

export type Session = {
  user: User
}

export type SupabaseAuthResponse = {
  data: {
    user: User | null
    session: Session | null
  }
  error: Error | null
}

export type SupabaseClient = ReturnType<typeof createClient>

// Create the actual Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

export const useSupabase = () => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabaseClient.auth.getSession()
        setSession(data.session)
        setUser(data.session?.user ?? null)
        
        const {
          data: { subscription },
        } = supabaseClient.auth.onAuthStateChange((_event, session) => {
          setSession(session)
          setUser(session?.user ?? null)
        })

        setLoading(false)
        
        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error('Error checking Supabase session:', error)
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  return {
    user,
    session,
    loading,
    supabase: supabaseClient,
  }
}

export default useSupabase
