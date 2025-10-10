"use client"

import { useState, useEffect, useRef } from "react"
import { Room } from "@/lib/room-manager"
import { Clock } from "lucide-react"
import { calculateTimerState } from "@/lib/timer-utils"
import "@/styles/countdown.css"

interface CountdownTimerProps {
  room: Room
  onCountdownComplete: () => void
}

export function CountdownTimer({ room, onCountdownComplete }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [isActive, setIsActive] = useState(false)
  const [previousTime, setPreviousTime] = useState<number>(0)
  const animationRef = useRef<number>()

  useEffect(() => {
    if (!room.countdownStartTime || !room.countdownDuration) {
      setIsActive(false)
      return
    }

    const updateCountdown = () => {
      const timerState = calculateTimerState(room)
      const remaining = timerState.countdown || 0
      
      // Track time changes for logging
      if (remaining !== previousTime && remaining > 0) {
        setPreviousTime(remaining)
      }
      
      setTimeLeft(remaining)
      setIsActive(remaining > 0)

      if (remaining <= 0) {
        onCountdownComplete()
      }
    }

    // Initial calculation
    updateCountdown()

    // Use requestAnimationFrame for smoother animation
    const animate = () => {
      updateCountdown()
      const timerState = calculateTimerState(room)
      const remaining = timerState.countdown || 0
      if (remaining > 0) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    // Start animation loop
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [room.countdownStartTime, room.countdownDuration, onCountdownComplete])

  // Show loading state if countdown data is not ready yet
  if (!room.countdownStartTime || !room.countdownDuration) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
        {/* Pixel Grid Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="pixel-grid"></div>
        </div>
        {/* Retro Scanlines */}
        <div className="absolute inset-0 opacity-10">
          <div className="scanlines"></div>
        </div>
        {/* Floating Pixel Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <PixelBackgroundElements />
        </div>
        <div className="relative z-10 text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
            <div className="relative bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg border-4 border-black shadow-2xl p-6">
              <div className="w-16 h-16 mx-auto bg-white border-2 border-black rounded flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-black animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 pixel-font">PREPARING COUNTDOWN...</h3>
              <p className="text-white/80 pixel-font-sm">GET READY FOR THE QUIZ!</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isActive || timeLeft <= 0) {
    return null
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
      {/* Pixel Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="pixel-grid"></div>
      </div>
      
      {/* Retro Scanlines */}
      <div className="absolute inset-0 opacity-10">
        <div className="scanlines"></div>
      </div>
      
      {/* Floating Pixel Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <PixelBackgroundElements />
      </div>

      <div className="relative z-10 text-center countdown-container">
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
          <div className="relative bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg border-4 border-black shadow-2xl p-8">
            {/* Countdown Icon with Continuous Spin */}
            <div className="w-20 h-20 mx-auto bg-white border-2 border-black rounded flex items-center justify-center mb-6 countdown-icon">
              <Clock className="w-10 h-10 text-black animate-spin" />
            </div>
            
            {/* Countdown Title */}
            <h3 className="text-2xl font-bold text-white mb-4 pixel-font countdown-message">GET READY!</h3>
            
            {/* Countdown Number with Smooth Animation */}
            <div className={`w-48 h-48 mx-auto flex items-center justify-center mb-6 countdown-number ${
              timeLeft <= 1 ? 'pixel-countdown final' :
              timeLeft <= 3 ? 'pixel-countdown urgent' :
              'pixel-countdown'
            }`}>
              <span className={`text-9xl font-black ${
                timeLeft <= 3 ? 'text-red-400' : 'text-white'
              }`}>
                {timeLeft}
              </span>
            </div>
            
            
           
          </div>
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
      <div className="absolute top-20 left-10 w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-400 opacity-30 pixel-block-float">
        <div className="w-full h-full border-2 border-white/50"></div>
      </div>
      <div className="absolute top-40 right-20 w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-400 opacity-40 pixel-block-float-delayed">
        <div className="w-full h-full border-2 border-white/50"></div>
      </div>
      <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-400 opacity-35 pixel-block-float-slow">
        <div className="w-full h-full border-2 border-white/50"></div>
      </div>
      <div className="absolute bottom-20 right-1/3 w-14 h-14 bg-gradient-to-br from-blue-400 to-indigo-400 opacity-45 pixel-block-float-delayed-slow">
        <div className="w-full h-full border-2 border-white/50"></div>
      </div>
    </>
  )
}
