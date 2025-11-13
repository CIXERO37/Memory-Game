import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { AuthGuard } from '../components/auth-guard'
import { I18nInitializer } from '../components/i18n-initializer'
import { PageTransition } from '../components/page-transition'

export const metadata: Metadata = {
  title: 'quiz-MemoryCard',
  description: 'Created with v0',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#1a1a2e" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Memory Quiz" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <I18nInitializer>
          <AuthGuard>
            <PageTransition>
              {children}
            </PageTransition>
          </AuthGuard>
          <Analytics />
        </I18nInitializer>
      </body>
    </html>
  )
}
