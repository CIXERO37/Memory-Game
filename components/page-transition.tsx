"use client"

import { useEffect, useState, ReactNode, useRef } from "react"
import { usePathname } from "next/navigation"

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const [displayChildren, setDisplayChildren] = useState(children)
  const prevPathnameRef = useRef<string | null>(null)

  useEffect(() => {
    // Update children immediately when pathname changes
    if (prevPathnameRef.current !== pathname) {
      setDisplayChildren(children)
    }
    
    prevPathnameRef.current = pathname
  }, [pathname, children])

  return (
    <div 
      className="page-transition-wrapper"
      style={{
        minHeight: '100vh',
        width: '100%',
      }}
    >
      {displayChildren}
    </div>
  )
}

