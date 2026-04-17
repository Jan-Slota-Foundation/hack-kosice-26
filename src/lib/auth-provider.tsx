import type { Session } from '@supabase/supabase-js'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { AuthContext, type AuthState } from './auth-context'
import { supabase } from './supabase'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setIsLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setIsLoading(false)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      session,
      user: session?.user ?? null,
      isAuthenticated: !!session,
      isLoading,
      signIn: async ({ email, password }) => {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        return { error }
      },
      signUp: async ({ email, password }) => {
        const { data, error } = await supabase.auth.signUp({ email, password })
        return {
          error,
          needsEmailConfirmation: !error && !data.session,
        }
      },
      signOut: async () => {
        await supabase.auth.signOut()
      },
    }),
    [session, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
