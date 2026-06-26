import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Event Run-Down',
  description: 'Langkawi Event 2026 — committee run-down',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
