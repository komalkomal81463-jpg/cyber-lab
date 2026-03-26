import { create } from 'zustand'
import api from '../utils/api'

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('cyberlab_token'),
  loading: false,
  error: null,

  login: async (username, password) => {
    set({ loading: true, error: null })
    try {
      const res = await api.post('/auth/login', { username, password })
      const { token, user } = res.data
      localStorage.setItem('cyberlab_token', token)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      set({ user, token, loading: false })
      return { success: true }
    } catch (e) {
      const msg = e.response?.data?.detail || 'Login failed'
      set({ error: msg, loading: false })
      return { success: false, error: msg }
    }
  },

  register: async (data) => {
    set({ loading: true, error: null })
    try {
      const res = await api.post('/auth/register', data)
      const { token, user } = res.data
      localStorage.setItem('cyberlab_token', token)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      set({ user, token, loading: false })
      return { success: true }
    } catch (e) {
      const msg = e.response?.data?.detail || 'Registration failed'
      set({ error: msg, loading: false })
      return { success: false, error: msg }
    }
  },

  logout: () => {
    localStorage.removeItem('cyberlab_token')
    delete api.defaults.headers.common['Authorization']
    set({ user: null, token: null })
  },

  fetchMe: async () => {
    const token = get().token
    if (!token) return
    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      const res = await api.get('/auth/me')
      set({ user: res.data })
    } catch {
      get().logout()
    }
  },

  clearError: () => set({ error: null }),
}))

export default useAuthStore
