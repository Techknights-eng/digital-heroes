import { useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'
import { AuthContext } from './AuthContextValue.js'

function getErrorMessage(error, fallback) {
  return error?.message || fallback
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profileError, setProfileError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function restoreSession() {
      if (!supabase) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase.auth.getSession()

      if (!active) return

      if (error) {
        console.error('Unable to restore the Supabase session.', error)
        setLoading(false)
        return
      }

      setUser(data.session?.user ?? null)
      if (data.session?.user) {
        setProfileError('')
        await loadProfile(data.session.user.id)
      }
      if (active) setLoading(false)
    }

    async function loadProfile(userId) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()

      if (!active) return

      if (error) {
        console.error('Unable to load the user profile.', error)
        setProfile(null)
        setProfileError('We could not load your profile. Please try signing in again.')
        return
      }

      setProfile(data)
      setProfileError(data ? '' : 'Your account profile is not available yet. Please contact support.')
    }

    restoreSession()

    const authListener = supabase
      ? supabase.auth.onAuthStateChange((event, session) => {
          if (!active) return

          setUser(session?.user ?? null)
          if (session?.user) {
            setProfileError('')
            setLoading(true)
            void loadProfile(session.user.id).finally(() => {
              if (active) setLoading(false)
            })
          } else {
            setProfile(null)
            setProfileError('')
            setLoading(false)
          }
        })
      : null
    const subscription = authListener?.data?.subscription

    return () => {
      active = false
      subscription?.unsubscribe()
    }
  }, [])

  async function signIn(email, password) {
    if (!isSupabaseConfigured) throw new Error('Authentication is not configured yet.')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(getErrorMessage(error, 'Unable to sign in.'))
    return data
  }

  async function signUp(email, password, fullName) {
    if (!isSupabaseConfigured) throw new Error('Authentication is not configured yet.')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw new Error(getErrorMessage(error, 'Unable to create your account.'))
    return data
  }

  async function signOut() {
    if (!supabase) throw new Error('Authentication is not configured yet.')

    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(getErrorMessage(error, 'Unable to sign out.'))
  }

  const value = {
    user,
    profile,
    profileError,
    loading,
    isAuthenticated: Boolean(user),
    isAdmin: profile?.role?.toLowerCase() === 'admin',
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
