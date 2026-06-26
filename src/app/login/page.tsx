'use client'
import { useState } from 'react'
import { createClient } from '../../lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function signIn(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <form onSubmit={signIn} className="bg-white border rounded-2xl p-8 w-full max-w-sm shadow">
        <h1 className="text-xl font-bold text-slate-800">Event Run-Down</h1>
        <p className="text-sm text-slate-500 mb-5">Sign in with your email</p>
        {sent ? (
          <p className="text-emerald-700 text-sm">Check your email for the sign-in link.</p>
        ) : (
          <>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border rounded-lg px-3 py-2 mb-3"
            />
            <button className="w-full bg-slate-800 text-white rounded-lg py-2 font-semibold">
              Send magic link
            </button>
            {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          </>
        )}
      </form>
    </main>
  )
}
