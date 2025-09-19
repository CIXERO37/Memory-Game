"use client"

import { Button } from "@/components/ui/button"

const avatars = ["🦄", "🐸", "🦋", "🐝", "🐞", "🦊", "🐨", "🐼", "🦁", "🐯", "🐰", "🐹", "🐷", "🐮", "🐙", "🦀"]

interface AvatarSelectorProps {
  selectedAvatar: string
  onAvatarSelect: (avatar: string) => void
}

export function AvatarSelector({ selectedAvatar, onAvatarSelect }: AvatarSelectorProps) {
  return (
    <div className="grid grid-cols-8 gap-2">
      {avatars.map((avatar) => (
        <Button
          key={avatar}
          variant={selectedAvatar === avatar ? "default" : "outline"}
          size="sm"
          className="aspect-square text-lg p-0"
          onClick={() => onAvatarSelect(avatar)}
        >
          {avatar}
        </Button>
      ))}
    </div>
  )
}
