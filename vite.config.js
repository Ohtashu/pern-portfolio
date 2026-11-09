import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export function isSupabasePublicKey(key) {
  const value = typeof key === 'string' ? key.trim() : ''

  if (value.startsWith('sb_publishable_')) {
    return value.length > 'sb_publishable_'.length
  }

  const tokenParts = value.split('.')
  if (tokenParts.length !== 3 || !tokenParts[1]) {
    return false
  }

  try {
    const base64Payload = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/')
    const paddedPayload = base64Payload.padEnd(Math.ceil(base64Payload.length / 4) * 4, '=')
    const payload = JSON.parse(atob(paddedPayload))
    return payload.role === 'anon'
  } catch {
    return false
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
  if (supabaseKey && !isSupabasePublicKey(supabaseKey)) {
    throw new Error('VITE_SUPABASE_PUBLISHABLE_KEY must be a Supabase publishable key or legacy anon key.')
  }

  return {
    plugins: [react()],
    base: '/pern-portfolio/',
  }
})
