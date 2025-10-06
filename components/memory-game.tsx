"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// Animal emojis matching the homepage design
const emojis = ["🐱", "🐶", "🐰", "🐸", "🐨", "🐼"]

interface MemoryCard {
  id: number
  emoji: string
  isFlipped: boolean
  isMatched: boolean
}

interface MemoryGameProps {
  onCorrectMatch: () => void
  disabled?: boolean
}

export function MemoryGame({ onCorrectMatch, disabled = false }: MemoryGameProps) {
  const [cards, setCards] = useState<MemoryCard[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [showAll, setShowAll] = useState(true)
  const [canClick, setCanClick] = useState(false)

  // Initialize cards
  useEffect(() => {
    const shuffledEmojis = [...emojis, ...emojis].sort(() => Math.random() - 0.5)
    const initialCards = shuffledEmojis.map((emoji, index) => ({
      id: index,
      emoji,
      isFlipped: false,
      isMatched: false,
    }))
    setCards(initialCards)

    // Show all cards for 3 seconds
    const timer = setTimeout(() => {
      setShowAll(false)
      setCanClick(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  // Handle card click
  const handleCardClick = (cardId: number) => {
    if (!canClick || disabled || flippedCards.length >= 2) return

    const card = cards.find((c) => c.id === cardId)
    if (!card || card.isFlipped || card.isMatched) return

    const newFlippedCards = [...flippedCards, cardId]
    setFlippedCards(newFlippedCards)

    // Update card state
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, isFlipped: true } : c)))

    // Check for match when 2 cards are flipped
    if (newFlippedCards.length === 2) {
      const [firstId, secondId] = newFlippedCards
      const firstCard = cards.find((c) => c.id === firstId)
      const secondCard = cards.find((c) => c.id === secondId)

      if (firstCard && secondCard && firstCard.emoji === secondCard.emoji) {
        // Match found
        console.log("[MemoryGame] Match found:", firstCard.emoji)
        setTimeout(() => {
          setCards((prev) => prev.map((c) => (c.id === firstId || c.id === secondId ? { ...c, isMatched: true } : c)))
          setFlippedCards([])
          console.log("[MemoryGame] Calling onCorrectMatch callback")
          onCorrectMatch()
        }, 500)
      } else {
        // No match - flip back after delay
        setTimeout(() => {
          setCards((prev) => prev.map((c) => (c.id === firstId || c.id === secondId ? { ...c, isFlipped: false } : c)))
          setFlippedCards([])
        }, 1000)
      }
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto memory-game">
      <div className="text-center mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-2">MEMORY GAME</h2>
        {showAll && (
          <p className="text-xs text-blue-200 animate-pulse">
            Memorize the positions... {Math.ceil((3000 - (Date.now() % 3000)) / 1000)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 sm:gap-2 p-2 sm:p-3 bg-gradient-to-br from-white/10 to-white/5 border-2 border-white/30 rounded-lg">
        {cards.map((card) => (
          <div
            key={card.id}
            className={cn(
              "aspect-square cursor-pointer transition-all duration-300 hover:scale-105",
              "flex items-center justify-center text-lg sm:text-2xl",
              "border-2 bg-gradient-to-br from-white/20 to-white/10 rounded-lg",
              "min-h-[44px] min-w-[44px]", // Touch-friendly minimum size
              card.isMatched && "border-green-400 bg-green-500/20 scale-95",
              (card.isFlipped || card.isMatched || showAll) && "border-blue-400 bg-blue-500/20",
              disabled && "cursor-not-allowed opacity-50",
            )}
            onClick={() => handleCardClick(card.id)}
          >
            <div
              className={cn(
                "transition-all duration-300",
                card.isFlipped || card.isMatched || showAll ? "scale-100 opacity-100" : "scale-0 opacity-0",
              )}
            >
              {card.isFlipped || card.isMatched || showAll ? card.emoji : ""}
            </div>
            {!card.isFlipped && !card.isMatched && !showAll && (
              <div className="w-full h-full bg-gradient-to-br from-white/30 to-white/10 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 sm:w-6 sm:h-6 bg-white/20 rounded border border-white/30" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-center mt-3 text-xs text-blue-200">Click cards to find matching pairs</div>
    </div>
  )
}
