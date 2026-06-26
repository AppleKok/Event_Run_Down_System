'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [authError] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return new URLSearchParams(window.location.search).get('error') === 'auth'
  })

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const result = await signIn('nodemailer', { email, redirect: false, callbackUrl: '/guests' })
    if (result?.error) setError(result.error)
    else setSent(true)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <form onSubmit={handleSignIn} className="bg-white border rounded-2xl p-8 w-full max-w-sm shadow">
        <h1 className="text-xl font-bold text-slate-800">Event Run-Down</h1>
        <p className="text-sm text-slate-500 mb-5">Sign in with your email</p>
        {authError && (
          <p className="text-red-600 text-sm mb-4">
            That sign-in link was invalid or expired — please request a new one.
          </p>
        )}
        {sent ? (
          <p className="text-emerald-700 text-sm">Check your email for the sign-in link.</p>
        ) : (
          <>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@dls.global"
              className="w-full border rounded-lg px-3 py-2 mb-3 text-slate-900 placeholder:text-slate-400"
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
