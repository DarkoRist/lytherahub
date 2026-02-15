import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    const token = sessionStorage.getItem('lytherahub_token')
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const { data } = await api.get('/auth/me')
      setUser(data)
    } catch {
      sessionStorage.removeItem('lytherahub_token')
      sessionStorage.removeItem('lytherahub_refresh')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Check URL params for token (from OAuth callback redirect)
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const refresh = params.get('refresh')
    if (token) {
      sessionStorage.setItem('lytherahub_token', token)
      if (refresh) sessionStorage.setItem('lytherahub_refresh', refresh)
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname)
    }
    fetchUser()
  }, [fetchUser])

  const loginDemo = async () => {
    const { data } = await api.get('/auth/demo')
    sessionStorage.setItem('lytherahub_token', data.access_token)
    sessionStorage.setItem('lytherahub_refresh', data.refresh_token)
    setUser(data.user)
    return data.user
  }

  const loginGoogle = () => {
    window.location.href = '/api/auth/google'
  }

  const logout = () => {
    sessionStorage.removeItem('lytherahub_token')
    sessionStorage.removeItem('lytherahub_refresh')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginDemo, loginGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
