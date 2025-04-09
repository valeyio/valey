import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { useRouter } from 'next/router'
import { supabaseClient } from './useSupabase'
import type { User, Session } from './useSupabase'

type AuthContextType = {
  session: Session | null
  user: User | null
  profile: any
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Get the session and user on load
    const fetchSession = async () => {
      try {
        const {
          data: { session },
        } = await supabaseClient.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          setProfile(profile)
        }
      } catch (error) {
        console.error('Error fetching session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSession()

    // Listen for auth changes
    try {
      const {
        data: { subscription },
      } = supabaseClient.auth.onAuthStateChange(async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          setProfile(profile)
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
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error: any) {
      return { error }
    }
  }

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => {
    try {
      const { error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      })

      if (!error) {
        // Update profile with first_name and last_name
        const {
          data: { user },
        } = await supabaseClient.auth.getUser()
        if (user) {
          await supabaseClient.from('profiles').upsert({
            id: user.id,
            first_name: firstName,
            last_name: lastName,
            updated_at: new Date(),
          })
        }
      }

      return { error }
    } catch (error: any) {
      return { error }
    }
  }

  const signOut = async () => {
    try {
      await supabaseClient.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
