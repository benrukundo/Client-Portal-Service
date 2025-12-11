import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/shared/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ClientHub - Client Portal for Service Businesses',
  description: 'A white-labeled client portal for agencies to manage clients, projects, and invoices.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}