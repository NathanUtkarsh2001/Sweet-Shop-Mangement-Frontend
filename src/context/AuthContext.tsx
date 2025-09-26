import { createContext, useState, useContext, ReactNode } from 'react'
import api, { setAuthToken } from '../api/api'

interface AuthContextType {
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password }) as any
    setToken(res.data.token)
    localStorage.setItem('token', res.data.token)
    setAuthToken(res.data.token)
  }

  const register = async (email: string, password: string, name: string) => {
    await api.post('/auth/register', { email, password, name })
  }

  const logout = () => {
    setToken(null)
    localStorage.removeItem('token')
    setAuthToken(null)
  }

  return (
    <AuthContext.Provider value={{ token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
