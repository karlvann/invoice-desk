import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ausbeds Invoice App',
  description: 'Professional invoice management for ausbeds',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}