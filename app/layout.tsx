import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { AuthGuard } from '../components/auth-guard'
import { I18nInitializer } from '../components/i18n-initializer'
import { PageTransition } from '../components/page-transition'

export const metadata: Metadata = {
  title: 'Memory Quiz',
  description: 'CHALLENGE YOUR MIND WITH MEMORY GAMES AND QUIZZES',
  generator: 'v0.app',
  manifest: '/site.webmanifest',
  themeColor: '#1a1a2e',
  metadataBase: new URL('https://memorygame-quiz.vercel.app'),
  openGraph: {
    title: 'Memory Quiz',
    description: 'CHALLENGE YOUR MIND WITH MEMORY GAMES AND QUIZZES',
    url: 'https://memorygame-quiz.vercel.app',
    siteName: 'Memory Quiz',
    images: [
      {
        url: '/images/memoryquiz.webp',
        width: 1200,
        height: 630,
        alt: 'Memory Quiz',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Memory Quiz',
    description: 'CHALLENGE YOUR MIND WITH MEMORY GAMES AND QUIZZES',
    images: ['/images/memoryquiz.webp'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Memory Quiz',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
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
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
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
