'use client'
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

// Renders a scannable QR for the given URL as a PNG data-URL. Client-only (qrcode
// runs in the browser); shows nothing until generated.
export function QrCode({ value, size = 200, className = '' }: { value: string; size?: number; className?: string }) {
  const [src, setSrc] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!value) return
    let alive = true
    QRCode.toDataURL(value, { width: size, margin: 1, errorCorrectionLevel: 'M' })
      .then((url) => { if (alive) setSrc(url) })
      .catch(() => { if (alive) setErr('Gagal menjana QR') })
    return () => { alive = false }
  }, [value, size])

  if (err) return <div className="text-xs text-red-500">{err}</div>
  if (!src) return <div style={{ width: size, height: size }} className={`bg-slate-100 rounded-lg animate-pulse ${className}`} />
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} width={size} height={size} alt="QR code" className={className} />
}
