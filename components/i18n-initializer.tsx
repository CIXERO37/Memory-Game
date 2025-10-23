"use client"

import { useEffect } from 'react'
import '../lib/i18n'

export function I18nInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // i18n is initialized when lib/i18n is imported
  }, [])

  return <>{children}</>
}

