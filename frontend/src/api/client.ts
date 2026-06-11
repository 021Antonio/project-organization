import axios from 'axios'

const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
const API_URL = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — attach JWT
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('hp_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — redirect to login on 401
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hp_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default client
