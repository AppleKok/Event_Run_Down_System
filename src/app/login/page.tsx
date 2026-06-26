'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [signing, setSigning] = useState(false)

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSigning(true)
    try {
      const result = await signIn('credentials', { username, password, redirect: false })
      if (result?.error) setError('Invalid username or password.')
      else window.location.href = '/guests'
    } catch {
      setError('Something went wrong — please try again.')
    } finally {
      setSigning(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <form onSubmit={handleSignIn} className="bg-white border rounded-2xl p-8 w-full max-w-sm shadow">
        <h1 className="text-xl font-bold text-slate-800">Event Run-Down</h1>
        <p className="text-sm text-slate-500 mb-5">Sign in to continue</p>
        <input
          type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
          placeholder="Username" autoCapitalize="none" autoComplete="username"
          className="w-full border rounded-lg px-3 py-2 mb-3 text-slate-900 placeholder:text-slate-400"
        />
        <input
          type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="Password" autoComplete="current-password"
          className="w-full border rounded-lg px-3 py-2 mb-3 text-slate-900 placeholder:text-slate-400"
        />
        <button disabled={signing} className="w-full bg-slate-800 text-white rounded-lg py-2 font-semibold disabled:opacity-60">
          {signing ? 'Signing in…' : 'Sign in'}
        </button>
        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
      </form>
    </main>
  )
}
