"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

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
    // Use first 6 animals for the game (12 cards total - 6 pairs)
    const gameAnimals = animalImages.slice(0, 6)
    const shuffledImages = [...gameAnimals, ...gameAnimals].sort(() => Math.random() - 0.5)
    const initialCards = shuffledImages.map((image, index) => ({
      id: index,
      image,
      isFlipped: false,
      isMatched: false,
      isHidden: false,
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
        // Match found
        console.log("[MemoryGame] Match found:", firstCard.image.name)
        setTimeout(() => {
          setCards((prev) => prev.map((c) => (c.id === firstId || c.id === secondId ? { ...c, isMatched: true } : c)))
          setFlippedCards([])
          console.log("[MemoryGame] Calling onCorrectMatch callback")
          onCorrectMatch()
          
          // Setelah 1.5 detik, mulai animasi hide kartu yang sudah matched
          setTimeout(() => {
            setCards((prev) => prev.map((c) => (c.id === firstId || c.id === secondId ? { ...c, isHidden: true } : c)))
          }, 1500)
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
              "aspect-square cursor-pointer transition-all duration-500 ease-in-out",
              "flex items-center justify-center",
              "border-2 bg-gradient-to-br from-white/20 to-white/10 rounded-lg",
              "min-h-[60px] min-w-[60px] sm:min-h-[80px] sm:min-w-[80px]", // More reasonable size
              !card.isHidden && "hover:scale-105",
              card.isMatched && !card.isHidden && "border-green-400 bg-green-500/20 scale-95",
              (card.isFlipped || (card.isMatched && !card.isHidden) || showAll) && "border-blue-400 bg-blue-500/20",
              disabled && "cursor-not-allowed opacity-50",
              // Animasi hilang yang smooth: fade out + scale down + rotate
              card.isHidden && "opacity-0 scale-0 rotate-12 pointer-events-none origin-center",
            )}
            onClick={() => handleCardClick(card.id)}
          >
            <div
              className={cn(
                "transition-all duration-500 ease-in-out w-full h-full flex items-center justify-center",
                (card.isFlipped || (card.isMatched && !card.isHidden) || showAll) && !card.isHidden ? "scale-100 opacity-100" : "scale-0 opacity-0",
              )}
            >
              {(card.isFlipped || (card.isMatched && !card.isHidden) || showAll) && !card.isHidden ? (
                <img
                  src={card.image.src}
                  alt={card.image.name}
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                  onError={(e) => {
                    // Fallback to emoji if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = document.createElement('div');
                    fallback.textContent = '🐾';
                    fallback.className = 'text-xl sm:text-2xl';
                    target.parentNode?.appendChild(fallback);
                  }}
                />
              ) : null}
            </div>
            {!card.isFlipped && !card.isMatched && !showAll && null}
          </div>
        ))}
      </div>

      <div className="text-center mt-3 text-xs text-blue-200">
        Click cards to find matching pairs and complete this mini game to continue.
      </div>
    </div>
  )
}
