"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

export function usePageTransition() {
  const pathname = usePathname()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [prevPathname, setPrevPathname] = useState<string | null>(null)

  useEffect(() => {
    if (prevPathname && prevPathname !== pathname) {
      setIsTransitioning(true)
      
      // Transition duration
      const timer = setTimeout(() => {
        setIsTransitioning(false)
      }, 400)

      return () => clearTimeout(timer)
    }
    
    setPrevPathname(pathname)
  }, [pathname, prevPathname])

  return { isTransitioning }
}

