import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

export default function Login() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await axios.post(`${API_URL}/auth/login`, { password })
      localStorage.setItem('hp_token', res.data.token)
      navigate('/', { replace: true })
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#e8eef8] flex items-center justify-center p-4">
      <div className="w-full max-w-xs">
        <div className="bg-[#f0f4ff] border border-[#c8d4ee] rounded-md overflow-hidden">
          {/* Header */}
          <div className="bg-white border-b border-[#dce6f8] px-5 py-4 text-center">
            <div className="font-mono text-[9px] text-[#7a9acf] tracking-[0.14em] mb-1">
              SYSTEM INTERFACE v2.4
            </div>
            <div className="text-lg font-bold text-[#1a3a7f] tracking-[0.1em] uppercase">
              Hunter Planner
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5">
            <div className="mb-4">
              <label className="font-mono text-[9px] text-[#7a9acf] tracking-[0.12em] block mb-2">
                ACCESS KEY
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full font-rajdhani text-sm font-medium border border-[#dce6f8] rounded-sm px-3 py-2 bg-[#f8faff] text-[#1a2540] outline-none focus:border-[#5a80df] focus:bg-white transition-colors"
                autoFocus
              />
            </div>

            {error && (
              <div className="font-mono text-[10px] text-[#8a1a1a] bg-[#ffecec] border border-[#f0a0a0] px-3 py-1.5 rounded-sm mb-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full font-rajdhani text-sm font-semibold px-4 py-2 border border-[#5a80df] bg-[#eaf0ff] text-[#1a3a7f] rounded-sm tracking-[0.08em] hover:bg-[#d8e8ff] transition-colors disabled:opacity-50"
            >
              {loading ? 'CONNECTING...' : 'LOGIN'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
