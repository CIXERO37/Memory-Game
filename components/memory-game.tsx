"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Sparkles, X, Star, Zap, AlertTriangle, Shuffle, Eye } from "lucide-react"


// Animal images from memogame folder
const animalImages = [
  { name: "cat", src: "/memogame/cat.webp" },
  { name: "cow", src: "/memogame/cow.webp" },
  { name: "crab", src: "/memogame/crab.webp" },
  { name: "jellyfish", src: "/memogame/jellyfish.webp" },
  { name: "koala", src: "/memogame/koala.webp" },
  { name: "parrot", src: "/memogame/parrot.webp" },
  { name: "sea-turtle", src: "/memogame/sea-turtle.webp" },
  { name: "whale", src: "/memogame/whale.webp" }
]

interface MemoryCard {
  id: number
  image: { name: string; src: string }
  isFlipped: boolean
  isMatched: boolean
  isHidden: boolean
  shuffleDelay?: number // For staggered shuffle animation
}

interface MemoryGameProps {
  onCorrectMatch: () => void
  disabled?: boolean
  roomCode?: string // Added for persistence
}

export function MemoryGame({ onCorrectMatch, disabled = false, roomCode }: MemoryGameProps) {
  const [cards, setCards] = useState<MemoryCard[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [showAll, setShowAll] = useState(true)
  const [canClick, setCanClick] = useState(false)
  const [shakingCards, setShakingCards] = useState<number[]>([])
  const [combo, setCombo] = useState(0)
  const [showCombo, setShowCombo] = useState<{ show: boolean, value: number }>({ show: false, value: 0 })
  const [particles, setParticles] = useState<{ id: number, x: number, y: number, color: string }[]>([])

  // 🌀 Flip All Wrong Penalty States
  const [consecutiveWrongs, setConsecutiveWrongs] = useState(0)
  const [isShuffling, setIsShuffling] = useState(false)
  const [showPenaltyWarning, setShowPenaltyWarning] = useState(false)
  const [showShuffleText, setShowShuffleText] = useState(false)

  // 🎯 Position-based shuffle animation
  const [shuffleTransforms, setShuffleTransforms] = useState<{ [cardId: number]: { x: number, y: number } }>({})
  const cardRefs = useRef<{ [cardId: number]: HTMLDivElement | null }>({})
  const gridRef = useRef<HTMLDivElement>(null)

  // Storage key for this room
  const storageKey = roomCode ? `memory-cards-state-${roomCode}` : null

  // Initialize cards - load from localStorage if available
  useEffect(() => {
    // Try to load saved state from localStorage
    if (storageKey && typeof window !== 'undefined') {
      const savedState = localStorage.getItem(storageKey)
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState)
          if (parsed.cards && Array.isArray(parsed.cards) && parsed.cards.length === 12) {
            // Restore saved cards state
            setCards(parsed.cards.map((c: any) => ({
              ...c,
              isFlipped: false, // Reset flipped state
              shuffleDelay: 0,
            })))

            // Check how many are already matched
            const matchedCount = parsed.cards.filter((c: any) => c.isMatched).length / 2

            // If there are matched cards, skip the initial show-all phase
            if (matchedCount > 0) {
              setShowAll(false)
              setCanClick(true)
              return
            }
          }
        } catch (e) {
          console.error('[MemoryGame] Error loading saved state:', e)
        }
      }
    }

    // No saved state or first time - generate new cards
    const gameAnimals = animalImages.slice(0, 6)
    const shuffledImages = [...gameAnimals, ...gameAnimals].sort(() => Math.random() - 0.5)
    const initialCards = shuffledImages.map((image, index) => ({
      id: index,
      image,
      isFlipped: false,
      isMatched: false,
      isHidden: false,
      shuffleDelay: 0,
    }))
    setCards(initialCards)

    // Save initial state to localStorage
    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify({ cards: initialCards }))
    }

    // Show all cards for 3 seconds
    const timer = setTimeout(() => {
      setShowAll(false)
      setCanClick(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [storageKey])

  // Save cards state to localStorage whenever it changes
  useEffect(() => {
    if (storageKey && typeof window !== 'undefined' && cards.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify({ cards }))
    }
  }, [cards, storageKey])

  // 🌀 Shuffle unmatched cards with slide animation
  const [showMemorizeText, setShowMemorizeText] = useState(false)

  const triggerShuffle = () => {
    setCanClick(false)
    setIsShuffling(true)
    setShowShuffleText(true)

    // Step 1: Flip all unmatched cards back
    setCards(prev => prev.map(c =>
      c.isMatched ? c : { ...c, isFlipped: false }
    ))

    // Step 2: After flip animation, calculate positions and animate shuffle
    setTimeout(() => {
      // Get current positions of all unmatched cards
      const unmatchedCardIds = cards
        .filter(c => !c.isMatched && !c.isHidden)
        .map(c => c.id)

      // Record current positions
      const positions: { [id: number]: { x: number, y: number } } = {}
      unmatchedCardIds.forEach(id => {
        const el = cardRefs.current[id]
        if (el) {
          const rect = el.getBoundingClientRect()
          positions[id] = { x: rect.left, y: rect.top }
        }
      })

      // Create shuffled order
      const shuffledIds = [...unmatchedCardIds].sort(() => Math.random() - 0.5)

      // Calculate transforms: where each card needs to move to
      const transforms: { [id: number]: { x: number, y: number } } = {}
      unmatchedCardIds.forEach((originalId, index) => {
        const targetId = shuffledIds[index]
        if (positions[originalId] && positions[targetId]) {
          // Calculate how far this card needs to move
          transforms[originalId] = {
            x: positions[targetId].x - positions[originalId].x,
            y: positions[targetId].y - positions[originalId].y
          }
        }
      })

      // Apply transforms to trigger slide animation
      setShuffleTransforms(transforms)

      // Step 3: After slide animation completes, actually swap the images
      setTimeout(() => {
        setCards(prev => {
          const unmatchedCards = prev.filter(c => !c.isMatched && !c.isHidden)
          const shuffledImages = unmatchedCards
            .map(c => c.image)
            .sort(() => Math.random() - 0.5)

          let unmatchedIndex = 0
          return prev.map((card) => {
            if (card.isMatched || card.isHidden) {
              return card
            }
            const newCard = {
              ...card,
              image: shuffledImages[unmatchedIndex],
            }
            unmatchedIndex++
            return newCard
          })
        })

        // Clear transforms after swap
        setShuffleTransforms({})
        setIsShuffling(false)
        setShowShuffleText(false)
        setConsecutiveWrongs(0)

        // 🎯 Show all cards for 3.5 seconds to memorize new positions
        setShowAll(true)
        setShowMemorizeText(true)
      }, 800) // Animation duration
    }, 500) // Wait for flip animation

    // Step 3.5: Hide memorize text after 1 second (but keep cards visible)
    setTimeout(() => {
      setShowMemorizeText(false)
    }, 2300) // 500ms flip + 800ms slide + 1000ms text

    // Step 4: Hide cards and re-enable clicking after memorization period
    setTimeout(() => {
      setShowAll(false)
      setCanClick(true)
    }, 4800) // 500ms flip + 800ms slide + 3500ms memorize
  }

  // Handle card click
  const handleCardClick = (cardId: number, e: React.MouseEvent) => {
    if (!canClick || disabled || flippedCards.length >= 2 || isShuffling) return


    const card = cards.find((c) => c.id === cardId)
    if (!card || card.isFlipped || card.isMatched || card.isHidden) return

    const newFlippedCards = [...flippedCards, cardId]
    setFlippedCards(newFlippedCards)

    // Update card state
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, isFlipped: true } : c)))

    // Check for match when 2 cards are flipped
    if (newFlippedCards.length === 2) {
      const [firstId, secondId] = newFlippedCards
      const firstCard = cards.find((c) => c.id === firstId)
      const secondCard = cards.find((c) => c.id === secondId)

      if (firstCard && secondCard && firstCard.image.name === secondCard.image.name) {
        // Match found - reset consecutive wrongs
        setConsecutiveWrongs(0)
        setCombo(prev => prev + 1)
        if (combo >= 1) {
          setShowCombo({ show: true, value: combo + 1 })
          setTimeout(() => setShowCombo({ show: false, value: 0 }), 1500)
        }

        // Trigger particles
        const newParticles = Array.from({ length: 12 }).map((_, i) => ({
          id: Date.now() + i,
          x: (e.clientX - 20) + (Math.random() * 40 - 20),
          y: (e.clientY - 20) + (Math.random() * 40 - 20),
          color: ['#3b82f6', '#8b5cf6', '#06b6d4', '#4ade80'][Math.floor(Math.random() * 4)]
        }))
        setParticles(prev => [...prev, ...newParticles])
        setTimeout(() => setParticles(prev => prev.filter(p => !newParticles.includes(p))), 1000)

        setTimeout(() => {
          setCards((prev) => prev.map((c) => (c.id === firstId || c.id === secondId ? { ...c, isMatched: true } : c)))
          setFlippedCards([])

          onCorrectMatch()

          // Setelah 1.5 detik, mulai animasi hide kartu yang sudah matched
          setTimeout(() => {
            setCards((prev) => prev.map((c) => (c.id === firstId || c.id === secondId ? { ...c, isHidden: true } : c)))
          }, 1500)
        }, 500)
      } else {
        // No match - increment consecutive wrongs
        const newWrongCount = consecutiveWrongs + 1
        setConsecutiveWrongs(newWrongCount)
        setCombo(0) // Reset combo

        // Show warning at 2 consecutive wrongs
        if (newWrongCount === 2) {
          setShowPenaltyWarning(true)
          setTimeout(() => setShowPenaltyWarning(false), 2000)
        }

        setTimeout(() => {
          setShakingCards([firstId, secondId])
          setTimeout(() => setShakingCards([]), 500)
        }, 300)

        setTimeout(() => {
          setCards((prev) => prev.map((c) => (c.id === firstId || c.id === secondId ? { ...c, isFlipped: false } : c)))
          setFlippedCards([])

          // 🌀 PENALTY: Trigger shuffle at 3 consecutive wrongs
          if (newWrongCount >= 3) {
            setTimeout(() => {
              triggerShuffle()
            }, 300)
          }
        }, 1000)
      }
    }
  }


  return (
    <div className="w-full max-w-lg mx-auto memory-game relative">
      <style jsx>{`
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-8px) rotate(-5deg); }
            40% { transform: translateX(8px) rotate(5deg); }
            60% { transform: translateX(-8px) rotate(-5deg); }
            80% { transform: translateX(8px) rotate(5deg); }
        }
        .animate-shake {
            animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
            border-color: #ef4444 !important;
            background-color: rgba(239, 68, 68, 0.2) !important;
        }
        @keyframes particle-explode {
            0% { transform: translate(0, 0) scale(1); opacity: 1; }
            100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
        }
        .particle {
            position: fixed;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            pointer-events: none;
            z-index: 50;
            animation: particle-explode 0.8s ease-out forwards;
        }
        @keyframes combo-popup {
            0% { transform: scale(0.5) translateY(0); opacity: 0; }
            50% { transform: scale(1.2) translateY(-20px); opacity: 1; }
            100% { transform: scale(1) translateY(-40px); opacity: 0; }
        }
        .combo-text {
            animation: combo-popup 1s ease-out forwards;
        }
        @keyframes penalty-pulse {
            0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
            50% { transform: scale(1.02); box-shadow: 0 0 20px 5px rgba(239, 68, 68, 0.4); }
        }
        .penalty-pulse {
            animation: penalty-pulse 0.5s ease-in-out 3;
        }
        @keyframes warning-shake {
            0%, 100% { transform: translateX(-50%) translateY(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-50%) translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(-50%) translateX(5px); }
        }
        .warning-text {
            animation: warning-shake 0.6s ease-in-out, combo-popup 2s ease-out forwards;
        }
        @keyframes shuffle-text {
            0% { transform: scale(0.5) rotate(-10deg); opacity: 0; }
            50% { transform: scale(1.3) rotate(5deg); opacity: 1; }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .shuffle-text {
            animation: shuffle-text 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>

      {/* Visual Effects */}
      {particles.map(p => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.x,
            top: p.y,
            backgroundColor: p.color,
            '--tx': `${(Math.random() - 0.5) * 150}px` as any,
            '--ty': `${(Math.random() - 0.5) * 150}px` as any
          } as any}
        />
      ))}

      {showCombo.show && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none combo-text">
          <div className="text-4xl font-black text-yellow-400 drop-shadow-[0_4px_0_rgba(0,0,0,1)] flex items-center gap-2">
            <Zap className="w-8 h-8 fill-yellow-400" />
            COMBO x{showCombo.value}
          </div>
        </div>
      )}

      {/* 🌀 Penalty Warning (at 2 consecutive wrongs) - Simple & Centered */}
      {showPenaltyWarning && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div className="text-base font-semibold text-red-300 flex items-center gap-2 bg-red-950/90 px-5 py-2.5 rounded-full border border-red-500/40 shadow-lg shadow-red-500/20 backdrop-blur-sm">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
            1 more miss = shuffle
          </div>
        </div>
      )}

      {/* 🌀 Shuffle Text Overlay - Simple */}
      {showShuffleText && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div className="text-base font-semibold text-orange-300 flex items-center gap-2 bg-orange-950/90 px-5 py-2.5 rounded-full border border-orange-500/40 shadow-lg shadow-orange-500/20 backdrop-blur-sm">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </span>
            shuffling
          </div>
        </div>
      )}



      <div className="text-center mb-4 min-h-[24px]">
        {!showAll && (
          <div className="flex justify-center items-center gap-2 flex-wrap">
            <div className="text-xs text-blue-200 bg-blue-900/40 px-3 py-1 rounded-full border border-blue-500/30">
              MATCHES: {cards.filter(c => c.isMatched).length / 2} / 6
            </div>
            {combo > 1 && (
              <div className="text-xs text-yellow-400 bg-yellow-900/40 px-3 py-1 rounded-full border border-yellow-500/30 font-bold animate-pulse">
                STREAK: {combo}
              </div>
            )}
            {/* 🌀 Wrong Counter - Simple dots */}
            {consecutiveWrongs > 0 && !isShuffling && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-800/60 border border-slate-600/30">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-2.5 h-2.5 rounded-full transition-all duration-300",
                      i <= consecutiveWrongs
                        ? i === 3 ? "bg-red-500 animate-pulse" : "bg-orange-400"
                        : "bg-slate-600"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className={cn(
        "grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-br from-slate-900/80 to-slate-900/60 border-2 border-slate-700/50 rounded-xl backdrop-blur-md shadow-2xl transition-all duration-300",
        isShuffling && "penalty-pulse border-orange-500/50"
      )}>
        {cards.map((card) => (
          <div
            key={card.id}
            className={cn(
              "aspect-square cursor-pointer transition-all duration-300",
              "flex items-center justify-center relative",
              "border-b-4 rounded-xl",
              "min-h-[60px] min-w-[60px] sm:min-h-[80px] sm:min-w-[80px]",
              !card.isHidden && !card.isMatched && !card.isFlipped && !showAll && !isShuffling && "hover:-translate-y-1 hover:brightness-110 active:translate-y-0 active:border-b-2",

              // Base Card State (Back)
              !card.isFlipped && !card.isMatched && !showAll && "bg-slate-800 border-slate-950 shadow-lg",

              // Matched State
              card.isMatched && !card.isHidden && "border-green-600 bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)] scale-95 border-b-0",

              // Flipped State (Front)
              (card.isFlipped || showAll) && !card.isMatched && !card.isHidden && "border-blue-600 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] translate-y-0 border-b-0",

              // Show All State (Initial)
              showAll && "border-b-0",

              disabled && "cursor-not-allowed opacity-50",
              card.isHidden && "opacity-0 scale-0 rotate-12 pointer-events-none",
              shakingCards.includes(card.id) && "animate-shake",
            )}
            ref={(el) => { cardRefs.current[card.id] = el }}
            style={{
              // Apply transform for sliding animation during shuffle
              transform: shuffleTransforms[card.id]
                ? `translate(${shuffleTransforms[card.id].x}px, ${shuffleTransforms[card.id].y}px)`
                : 'translate(0, 0)',
              transition: shuffleTransforms[card.id] ? 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'all 0.3s',
              zIndex: shuffleTransforms[card.id] ? 10 : 1,
            }}
            onClick={(e) => handleCardClick(card.id, e)}
          >
            {/* Card Content */}
            <div
              className={cn(
                "transition-all duration-300 w-full h-full flex items-center justify-center p-2",
                (card.isFlipped || (card.isMatched && !card.isHidden) || showAll) ? "scale-100 opacity-100" : "scale-0 opacity-0 absolute",
              )}
            >
              <img
                src={card.image.src}
                alt={card.image.name}
                className="w-full h-full object-contain drop-shadow-md"
                draggable={false}
              />
            </div>

            {/* Card Back Design */}
            {!card.isFlipped && !card.isMatched && !showAll && (
              <div className="absolute inset-0 flex items-center justify-center opacity-50">
                <div className="w-8 h-8 rounded-full border-2 border-slate-600 flex items-center justify-center">
                  <span className="text-slate-500 text-lg font-bold">?</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>


    </div>
  )
}

