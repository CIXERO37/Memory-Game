"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { LogOut, X } from 'lucide-react'

interface LogoutConfirmationDialogProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  userName?: string
}

export function LogoutConfirmationDialog({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  userName 
}: LogoutConfirmationDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative pixel-button-container mx-4 max-w-md w-full">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
        <div className="relative bg-gradient-to-br from-purple-700 rounded-lg border-4 border-black shadow-2xl p-6">
         

          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto bg-white border-4 border-black rounded-lg flex items-center justify-center mb-4">
              <LogOut className="w-8 h-8 text-black-600" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">KONFIRMASI</h2>
            <p className="text-white/80 font-medium">
              Apakah Anda yakin ingin logout{userName ? (
                <>
                  , <span className="text-red-600  font-bold">{userName}</span>
                </>
              ) : ''}?
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            {/* Cancel Button */}
            <div className="flex-1">
              <div className="relative pixel-button-container">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                <Button
                  onClick={onCancel}
                  className="relative w-full h-12 bg-gradient-to-br from-gray-500 to-gray-600 border-2 border-black rounded-lg shadow-2xl font-bold text-white text-lg pixel-button-host transform hover:scale-105 transition-all duration-300"
                >
                  BATAL
                </Button>
              </div>
            </div>

            {/* Confirm Button */}
            <div className="flex-1">
              <div className="relative pixel-button-container">
                <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                <Button
                  onClick={onConfirm}
                  className="relative w-full h-12 bg-gradient-to-br from-red-500 to-red-600 border-2 border-black rounded-lg shadow-2xl font-bold text-white text-lg pixel-button-host transform hover:scale-105 transition-all duration-300"
                >
                  LOGOUT
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

