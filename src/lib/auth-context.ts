import type { AuthError, Session, User } from '@supabase/supabase-js'
import { createContext, useContext } from 'react'

export interface AuthState {
  session: Session | null
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (args: {
    email: string
    password: string
  }) => Promise<{ error: AuthError | null }>
  signUp: (args: {
    email: string
    password: string
  }) => Promise<{ error: AuthError | null; needsEmailConfirmation: boolean }>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
