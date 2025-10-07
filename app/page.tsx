"use client"

import { Button } from "@/components/ui/button"
import { Users, Play, Brain, Lightbulb, HelpCircle, Server } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

export default function HomePage() {
  const dragCardRef = useRef<HTMLDivElement | null>(null)

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>

      {/* Pixel Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="pixel-grid"></div>
      </div>
      
      {/* Retro Scanlines */}
      <div className="absolute inset-0 opacity-10">
        <div className="scanlines"></div>
      </div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Pixel Elements */}
        <PixelBackgroundElements />
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

        {/* Falling + Draggable Pixel Cards */}
        <FallingPixelCards />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-4 sm:py-8 min-h-screen flex flex-col justify-center">
        {/* Main Content */}
        <div className="text-center mb-8 sm:mb-16">
          {/* Pixel Brain Icon with Card */}
          <div className="relative inline-block mb-4 sm:mb-8 pixel-logo-container">
            <div className="relative">
              {/* Pixel Brain */}
              <div className="w-20 h-20 sm:w-32 sm:h-32 mx-auto relative pixel-brain">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg opacity-20 blur-lg animate-pulse"></div>
                <div className="relative w-full h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg border-2 sm:border-4 border-white shadow-2xl flex items-center justify-center">
                  <Brain className="w-10 h-10 sm:w-16 sm:h-16 text-white" />
                </div>
              </div>
              
              {/* Pixel Card */}
              <div className="absolute -right-4 sm:-right-8 top-2 sm:top-4 w-16 h-20 sm:w-24 sm:h-32 bg-white rounded-lg shadow-2xl border-2 sm:border-4 border-black pixel-card-float">
                <div className="p-2 sm:p-3 h-full flex flex-col items-center justify-center">
                  <div className="w-4 h-4 sm:w-6 sm:h-6 bg-yellow-400 border-2 border-black rounded mb-1 sm:mb-2"></div>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 border-2 border-black rounded flex items-center justify-center">
                    <HelpCircle className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pixel Title */}
          <div className="mb-4 sm:mb-6">
            <div className="inline-block bg-white border-2 sm:border-4 border-black rounded-lg px-4 sm:px-8 py-2 sm:py-4 shadow-2xl pixel-title-container">
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-black pixel-title">
                MEMORY QUIZ
              </h1>
            </div>
          </div>
          
          {/* Pixel Description */}
          <div className="max-w-2xl mx-auto mb-6 sm:mb-12">
            <div className="bg-black/20 border-2 border-white/30 rounded-lg px-4 sm:px-6 py-3 sm:py-4 pixel-description">
              <p className="text-sm sm:text-base lg:text-lg text-white font-medium pixel-font-sm">
                CHALLENGE YOUR MIND WITH MEMORY GAMES AND EDUCATIONAL QUIZZES
              </p>
            </div>
          </div>
        </div>

        {/* Pixel Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 max-w-6xl mx-auto pixel-buttons-container px-4">
          <Link href="/select-quiz" className="flex-1 min-w-0">
            <div className="relative pixel-button-container">
              <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
              <button className="relative w-full h-16 sm:h-20 lg:h-24 bg-gradient-to-br from-green-500 to-emerald-500 border-2 sm:border-4 border-black rounded-lg shadow-2xl font-bold text-black text-lg sm:text-2xl lg:text-3xl pixel-button-host transform hover:scale-105 transition-all duration-300 px-4 sm:px-6">
                <div className="flex items-center justify-center gap-2 sm:gap-4">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-black rounded border-2 border-white flex items-center justify-center">
                    <Server className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <span className="text-lg sm:text-2xl lg:text-3xl font-bold">HOST</span>
                </div>
              </button>
            </div>
          </Link>
          
          <Link href="/join" className="flex-1 min-w-0">
            <div className="relative pixel-button-container">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
              <button className="relative w-full h-16 sm:h-20 lg:h-24 bg-gradient-to-br from-blue-500 to-purple-500 border-2 sm:border-4 border-black rounded-lg shadow-2xl font-bold text-white text-lg sm:text-2xl lg:text-3xl pixel-button-join transform hover:scale-105 transition-all duration-300 px-4 sm:px-6">
                <div className="flex items-center justify-center gap-2 sm:gap-4">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded border-2 border-black flex items-center justify-center">
                    <Play className="w-3 h-3 sm:w-5 sm:h-5 text-black" />
                  </div>
                  <span className="text-lg sm:text-2xl lg:text-3xl font-bold">JOIN</span>
                </div>
              </button>
            </div>
          </Link>
        </div>
      </div>

    </div>
  )
}

function PixelBackgroundElements() {
  const pixels = [
    { id: 1, color: 'bg-red-500', size: 'w-2 h-2', delay: '0s', duration: '3s', x: '10%', y: '20%' },
    { id: 2, color: 'bg-blue-500', size: 'w-3 h-3', delay: '1s', duration: '4s', x: '80%', y: '30%' },
    { id: 3, color: 'bg-green-500', size: 'w-2 h-2', delay: '2s', duration: '3.5s', x: '20%', y: '70%' },
    { id: 4, color: 'bg-yellow-500', size: 'w-4 h-4', delay: '0.5s', duration: '5s', x: '70%', y: '10%' },
    { id: 5, color: 'bg-purple-500', size: 'w-2 h-2', delay: '1.5s', duration: '4.5s', x: '50%', y: '80%' },
    { id: 6, color: 'bg-pink-500', size: 'w-3 h-3', delay: '2.5s', duration: '3s', x: '30%', y: '50%' },
    { id: 7, color: 'bg-cyan-500', size: 'w-2 h-2', delay: '0.8s', duration: '4s', x: '90%', y: '60%' },
    { id: 8, color: 'bg-orange-500', size: 'w-3 h-3', delay: '1.8s', duration: '3.8s', x: '15%', y: '40%' },
    { id: 9, color: 'bg-lime-500', size: 'w-2 h-2', delay: '2.2s', duration: '4.2s', x: '60%', y: '25%' },
    { id: 10, color: 'bg-indigo-500', size: 'w-4 h-4', delay: '0.3s', duration: '5.5s', x: '85%', y: '75%' },
  ]

  return (
    <>
      {pixels.map((pixel) => (
        <div
          key={pixel.id}
          className={`absolute ${pixel.color} ${pixel.size} pixel-float`}
          style={{
            left: pixel.x,
            top: pixel.y,
            animationDelay: pixel.delay,
            animationDuration: pixel.duration,
          }}
        />
      ))}
      
      {/* Floating Pixel Blocks */}
      <div className="absolute top-20 left-10 w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-400 opacity-30 pixel-block-float">
        <div className="w-full h-full border-2 border-white/50"></div>
      </div>
      <div className="absolute top-40 right-20 w-12 h-12 bg-gradient-to-br from-green-400 to-cyan-400 opacity-40 pixel-block-float-delayed">
        <div className="w-full h-full border-2 border-white/50"></div>
      </div>
      <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-br from-red-400 to-pink-400 opacity-35 pixel-block-float-slow">
        <div className="w-full h-full border-2 border-white/50"></div>
      </div>
      <div className="absolute bottom-20 right-1/3 w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-400 opacity-45 pixel-block-float-delayed-slow">
        <div className="w-full h-full border-2 border-white/50"></div>
      </div>
    </>
  )
}

function FallingPixelCards() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const stream: Array<{ id: string; label: string; color: string; x: string; delay: string; dur: string; rot: string; w?: string; h?: string; }> = [
    { id: '1', label: '🐱', color: 'bg-red-500', x: '5%', delay: '0s', dur: '12s', rot: '-6deg' },
    { id: '2', label: '🐶', color: 'bg-blue-500', x: '12%', delay: '2.8s', dur: '11.5s', rot: '8deg' },
    { id: '3', label: '🐰', color: 'bg-green-500', x: '20%', delay: '1.1s', dur: '13s', rot: '2deg' },
    { id: '4', label: '🐸', color: 'bg-yellow-500', x: '28%', delay: '3.6s', dur: '12.2s', rot: '-10deg' },
    { id: '5', label: '🐨', color: 'bg-purple-500', x: '36%', delay: '0.7s', dur: '14s', rot: '0deg' },
    { id: '6', label: '🐼', color: 'bg-pink-500', x: '44%', delay: '2.1s', dur: '11.8s', rot: '6deg' },
    { id: '7', label: '🦊', color: 'bg-cyan-500', x: '52%', delay: '4.1s', dur: '12.6s', rot: '-4deg' },
    { id: '8', label: '🐯', color: 'bg-orange-500', x: '60%', delay: '1.5s', dur: '13.4s', rot: '3deg' },
    { id: '9', label: '🦁', color: 'bg-lime-500', x: '68%', delay: '3.2s', dur: '12.1s', rot: '-8deg' },
    { id: '10', label: '🐸', color: 'bg-indigo-500', x: '76%', delay: '0.3s', dur: '10.9s', rot: '5deg' },
    { id: '11', label: '🐧', color: 'bg-emerald-500', x: '84%', delay: '2.4s', dur: '12.7s', rot: '1deg' },
    { id: '12', label: '🦆', color: 'bg-violet-500', x: '92%', delay: '4.6s', dur: '11.3s', rot: '-5deg' },
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
          className="pixel-card falling"
          style={{ ['--x' as any]: c.x, ['--delay' as any]: c.delay, ['--dur' as any]: c.dur, ['--rot' as any]: c.rot, ['--w' as any]: c.w ?? '88px', ['--h' as any]: c.h ?? '124px' }}
        >
          <div className={`w-full h-full ${c.color} border-4 border-black rounded-lg shadow-lg flex items-center justify-center`}>
            <span className="text-white font-bold text-6xl">{c.label}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
