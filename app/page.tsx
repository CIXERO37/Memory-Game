"use client"

import { Button } from "@/components/ui/button"
import { Users, Play, Brain, Lightbulb, HelpCircle, Server } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

export default function HomePage() {
  const dragCardRef = useRef<HTMLDivElement | null>(null)

  return (
    <div
      className="min-h-screen relative overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/60 via-blue-900/50 to-indigo-900/60 pointer-events-none" />
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Brain Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 opacity-20 animate-float">
          <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-400 to-purple-400 blur-xl"></div>
        </div>
        <div className="absolute top-40 right-20 w-24 h-24 opacity-30 animate-float-delayed">
          <div className="w-full h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 blur-lg"></div>
        </div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 opacity-25 animate-float-slow">
          <div className="w-full h-full rounded-full bg-gradient-to-r from-purple-400 to-pink-400 blur-2xl"></div>
        </div>
        <div className="absolute bottom-20 right-1/3 w-28 h-28 opacity-35 animate-float-delayed-slow">
          <div className="w-full h-full rounded-full bg-gradient-to-r from-green-400 to-cyan-400 blur-xl"></div>
        </div>

        {/* Neural Network Lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 1000 1000">
          <defs>
            <linearGradient id="neuralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          <g className="animate-pulse">
            <line x1="100" y1="200" x2="300" y2="150" stroke="url(#neuralGradient)" strokeWidth="2" />
            <line x1="300" y1="150" x2="500" y2="300" stroke="url(#neuralGradient)" strokeWidth="2" />
            <line x1="500" y1="300" x2="700" y2="250" stroke="url(#neuralGradient)" strokeWidth="2" />
            <line x1="200" y1="400" x2="400" y2="350" stroke="url(#neuralGradient)" strokeWidth="2" />
            <line x1="400" y1="350" x2="600" y2="500" stroke="url(#neuralGradient)" strokeWidth="2" />
            <line x1="600" y1="500" x2="800" y2="450" stroke="url(#neuralGradient)" strokeWidth="2" />
            <circle cx="100" cy="200" r="4" fill="#3b82f6" className="animate-ping" />
            <circle cx="300" cy="150" r="4" fill="#8b5cf6" className="animate-ping" style={{ animationDelay: '0.5s' }} />
            <circle cx="500" cy="300" r="4" fill="#06b6d4" className="animate-ping" style={{ animationDelay: '1s' }} />
            <circle cx="700" cy="250" r="4" fill="#3b82f6" className="animate-ping" style={{ animationDelay: '1.5s' }} />
            <circle cx="200" cy="400" r="4" fill="#8b5cf6" className="animate-ping" style={{ animationDelay: '2s' }} />
            <circle cx="400" cy="350" r="4" fill="#06b6d4" className="animate-ping" style={{ animationDelay: '2.5s' }} />
            <circle cx="600" cy="500" r="4" fill="#3b82f6" className="animate-ping" style={{ animationDelay: '3s' }} />
            <circle cx="800" cy="450" r="4" fill="#8b5cf6" className="animate-ping" style={{ animationDelay: '3.5s' }} />
          </g>
        </svg>

        {/* Falling + Draggable Playing Cards */}
        <FallingRemiCards />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col justify-center">
        {/* Main Content */}
        <div className="text-center mb-16">
          {/* Brain Icon with Card */}
          <div className="relative inline-block mb-8 animate-bounce-slow">
            <div className="relative">
              {/* Brain */}
              <div className="w-32 h-32 mx-auto relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-20 blur-lg animate-pulse"></div>
                <div className="relative w-full h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                  <Brain className="w-16 h-16 text-white" />
                </div>
                {/* Removed green dots as requested */}
              </div>
              
              {/* Card */}
              <div className="absolute -right-8 top-4 w-24 h-32 bg-white rounded-lg shadow-2xl border-2 border-blue-200 animate-float-card">
                <div className="p-3 h-full flex flex-col items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-yellow-500 mb-2" />
                  <HelpCircle className="w-8 h-8 text-blue-600 font-bold" />
                </div>
              </div>
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 animate-fade-in-up">
            <span className="typewriter" onAnimationEnd={(e) => e.currentTarget.classList.add('tw-done')}>Memory Quiz</span>
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-12 animate-fade-in-up-delayed">
            Challenge your mind with memory games and educational quizzes
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 max-w-md mx-auto animate-fade-in-up-delayed-2">
          <Link href="/select-quiz" className="flex-1">
            <button className="btn-host w-full h-20 text-xl">
              <Server className="w-7 h-7" />
              Host
            </button>
          </Link>
          
          <Link href="/join" className="flex-1">
            <button className="btn-join w-full h-20 text-xl">
              <Play className="w-7 h-7" />
              JOIN
            </button>
          </Link>
        </div>
      </div>

    </div>
  )
}

function FallingRemiCards() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const stream: Array<{ id: string; label: string; color: 'pc-red' | 'pc-black'; x: string; delay: string; dur: string; rot: string; w?: string; h?: string; }> = [
    { id: 'AS', label: 'A♠', color: 'pc-black', x: '5%', delay: '0s', dur: '12s', rot: '-6deg' },
    { id: 'KH', label: 'K♥', color: 'pc-red', x: '12%', delay: '2.8s', dur: '11.5s', rot: '8deg' },
    { id: 'QD', label: 'Q♦', color: 'pc-red', x: '20%', delay: '1.1s', dur: '13s', rot: '2deg' },
    { id: 'JC', label: 'J♣', color: 'pc-black', x: '28%', delay: '3.6s', dur: '12.2s', rot: '-10deg' },
    { id: '7H', label: '7♥', color: 'pc-red', x: '36%', delay: '0.7s', dur: '14s', rot: '0deg' },
    { id: '9S', label: '9♠', color: 'pc-black', x: '44%', delay: '2.1s', dur: '11.8s', rot: '6deg' },
    { id: '3D', label: '3♦', color: 'pc-red', x: '52%', delay: '4.1s', dur: '12.6s', rot: '-4deg' },
    { id: '5C', label: '5♣', color: 'pc-black', x: '60%', delay: '1.5s', dur: '13.4s', rot: '3deg' },
    { id: 'AH', label: 'A♥', color: 'pc-red', x: '68%', delay: '3.2s', dur: '12.1s', rot: '-8deg' },
    { id: 'QS', label: 'Q♠', color: 'pc-black', x: '76%', delay: '0.3s', dur: '10.9s', rot: '5deg' },
    { id: 'JD', label: 'J♦', color: 'pc-red', x: '84%', delay: '2.4s', dur: '12.7s', rot: '1deg' },
    { id: 'KC', label: 'K♣', color: 'pc-black', x: '92%', delay: '4.6s', dur: '11.3s', rot: '-5deg' },
  ]

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const els = Array.from(container.querySelectorAll('.playing-card')) as HTMLDivElement[]

    els.forEach((el, i) => {
      // initially falling; left set by CSS variable --x
      el.style.top = '-20vh'

      let startX = 0, startY = 0, origX = 0, origY = 0
      const onPointerDown = (e: PointerEvent) => {
        el.setPointerCapture(e.pointerId)
        startX = e.clientX
        startY = e.clientY
        const rect = el.getBoundingClientRect()
        origX = rect.left - (container.getBoundingClientRect().left)
        origY = rect.top - (container.getBoundingClientRect().top)
        el.style.transition = 'none'
        ;(el as HTMLElement).style.zIndex = '20'
        // stop falling when grabbed
        el.classList.remove('falling')
        el.style.animation = 'none'
      }
      const onPointerMove = (e: PointerEvent) => {
        if (!(el as any).hasPointerCapture?.(e.pointerId)) return
        const dx = e.clientX - startX
        const dy = e.clientY - startY
        el.style.left = origX + dx + 'px'
        el.style.top = origY + dy + 'px'
      }
      const onPointerUp = (e: PointerEvent) => {
        try { el.releasePointerCapture(e.pointerId) } catch {}
        el.style.transition = ''
        ;(el as HTMLElement).style.zIndex = '10'
      }
      el.addEventListener('pointerdown', onPointerDown)
      el.addEventListener('pointermove', onPointerMove)
      el.addEventListener('pointerup', onPointerUp)
    })

    return () => {
      const els = Array.from(container.querySelectorAll('.playing-card')) as HTMLDivElement[]
      els.forEach((el) => {
        el.replaceWith(el.cloneNode(true))
      })
    }
  }, [])

  return (
    <div ref={containerRef} className="absolute inset-0 z-0">
      {stream.map((c) => (
        <div
          key={c.id}
          className="playing-card falling"
          style={{ ['--x' as any]: c.x, ['--delay' as any]: c.delay, ['--dur' as any]: c.dur, ['--rot' as any]: c.rot, ['--w' as any]: c.w ?? '88px', ['--h' as any]: c.h ?? '124px' }}
        >
          <div className={`pc-corner ${c.color}`}>{c.label}</div>
          <div className={`pc-corner bottom ${c.color}`}>{c.label}</div>
          <div className={`pc-inner ${c.color}`}>{c.label.replace(/[^A-Z0-9♥♦♣♠]/g, '')}</div>
        </div>
      ))}
    </div>
  )
}
