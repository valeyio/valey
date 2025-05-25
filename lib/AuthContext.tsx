import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react'
import { useRouter } from 'next/router'
import { supabaseClient } from './useSupabase'
import type { User, Session } from './useSupabase'

interface Profile {
  id: string
  first_name?: string
  last_name?: string
  avatar_url?: string
  phone?: string
  company?: string
  created_at: string
  updated_at: string
}

type AuthContextType = {
  session: Session | null
  user: User | null
  profile: Profile | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => Promise<{ error: any }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Performance: Memoized profile fetch function
  const fetchProfile = useCallback(
    async (userId: string): Promise<Profile | null> => {
      try {
        const { data: profile, error } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (error) {
          console.error('Error fetching profile:', error)
          return null
        }

        return profile
      } catch (error) {
        console.error('Error in fetchProfile:', error)
        return null
      }
    },
    []
  )

  // Performance: Optimized profile refresh function
  const refreshProfile = useCallback(async () => {
    if (!user?.id) return

    try {
      const profileData = await fetchProfile(user.id)
      if (profileData) {
        setProfile(profileData)
      }
    } catch (error) {
      console.error('Error refreshing profile:', error)
    }
  }, [user?.id, fetchProfile])

  // Performance: Optimistic profile updates for immediate UI feedback
  const updateProfile = useCallback((updates: Partial<Profile>) => {
    setProfile((prev) => (prev ? { ...prev, ...updates } : null))
  }, [])

  // Performance: Memoized session fetch function
  const fetchSession = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession()

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        const profileData = await fetchProfile(session.user.id)
        setProfile(profileData)
      } else {
        setProfile(null)
      }
    } catch (error) {
      console.error('Error fetching session:', error)
    } finally {
      setIsLoading(false)
    }
  }, [fetchProfile])

  useEffect(() => {
    fetchSession()

    // Listen for auth changes with optimized profile fetching
    try {
      const {
        data: { subscription },
      } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state change:', event)

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          // Only fetch profile if user changed or on sign in
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            const profileData = await fetchProfile(session.user.id)
            setProfile(profileData)
          }
        } else {
          setProfile(null)
        }

        setIsLoading(false)
      })

      return () => {
        subscription.unsubscribe()
      }
    } catch (error) {
      console.error('Error setting up auth state change listener:', error)
      setIsLoading(false)
      return () => {}
    }
  }, [fetchSession, fetchProfile])

  // Performance: Memoized sign in function
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error: any) {
      return { error }
    }
  }, [])

  // Performance: Memoized sign up function with profile creation
  const signUp = useCallback(
    async (
      email: string,
      password: string,
      firstName: string,
      lastName: string
    ) => {
      try {
        const { error, data } = await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
            },
          },
        })

        if (!error && data.user) {
          // Create profile immediately after signup
          const { error: profileError } = await supabaseClient
            .from('profiles')
            .upsert(
              {
                id: data.user.id,
                first_name: firstName,
                last_name: lastName,
                updated_at: new Date().toISOString(),
              },
              {
                onConflict: 'id',
              }
            )

          if (profileError) {
            console.error('Error creating profile:', profileError)
          }
        }

        return { error }
      } catch (error: any) {
        return { error }
      }
    },
    []
  )

  // Performance: Memoized sign out function
  const signOut = useCallback(async () => {
    try {
      await supabaseClient.auth.signOut()
      setProfile(null)
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }, [router])

  // Performance: Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      session,
      user,
      profile,
      isLoading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      updateProfile,
    }),
    [
      session,
      user,
      profile,
      isLoading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      updateProfile,
    ]
  )

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
