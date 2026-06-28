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
      else window.location.href = '/'
    } catch {
      setError('Something went wrong — please try again.')
    } finally {
      setSigning(false)
    }
  }

  const input =
    'w-full border border-slate-200 rounded-lg px-3 py-2.5 mb-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition'

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <form onSubmit={handleSignIn} className="bg-white border border-slate-200 rounded-2xl p-8 w-full max-w-sm shadow-sm">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white grid place-items-center font-bold text-sm">RD</div>
          <div>
            <h1 className="text-base font-semibold text-slate-900 leading-tight">Event Run-Down</h1>
            <p className="text-[11px] text-slate-400 leading-tight">Langkawi · 30 Jun–1 Jul 2026</p>
          </div>
        </div>
        <p className="text-sm text-slate-500 mb-4">Committee sign-in</p>
        <input
          type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
          placeholder="Username" autoCapitalize="none" autoComplete="username" className={input}
        />
        <input
          type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="Password" autoComplete="current-password" className={input}
        />
        <button
          disabled={signing}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-semibold transition-colors disabled:opacity-60"
        >
          {signing ? 'Signing in…' : 'Sign in'}
        </button>
        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
      </form>
    </main>
  )
}
