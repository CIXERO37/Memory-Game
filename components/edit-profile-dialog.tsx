"use client"

import { useState, useEffect, useRef } from 'react'
import { X, User, Camera } from 'lucide-react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { UserProfile } from '@/hooks/use-auth'

interface EditProfileDialogProps {
    isOpen: boolean
    onClose: () => void
    userProfile: UserProfile
    onProfileUpdate: () => void
}

export function EditProfileDialog({ isOpen, onClose, userProfile, onProfileUpdate }: EditProfileDialogProps) {
    const [name, setName] = useState(userProfile.name || userProfile.username)
    const [avatarUrl, setAvatarUrl] = useState(userProfile.avatar_url || '')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [previewUrl, setPreviewUrl] = useState(userProfile.avatar_url || '')
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isOpen) {
            setName(userProfile.name || userProfile.username)
            setAvatarUrl(userProfile.avatar_url || '')
            setPreviewUrl(userProfile.avatar_url || '')
            setError('')
        }
    }, [isOpen, userProfile])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleUpload(e.target.files[0])
        }
    }

    const handleUpload = async (file: File) => {
        setIsUploading(true)
        setError('')

        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${userProfile.id}-${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            setAvatarUrl(publicUrl)
            setPreviewUrl(publicUrl)
        } catch (err: any) {
            console.error('Error uploading avatar:', err)
            setError('Failed to upload avatar. Please try again.')
        } finally {
            setIsUploading(false)
        }
    }

    const handleSave = async () => {
        if (!name.trim()) {
            setError('Name cannot be empty')
            return
        }

        setIsLoading(true)
        setError('')

        try {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    fullname: name.trim(),
                    avatar_url: avatarUrl.trim() || null,
                })
                .eq('id', userProfile.id)

            if (updateError) throw updateError

            // Call the callback to refresh user profile
            onProfileUpdate()
            onClose()
        } catch (err: any) {
            console.error('Error updating profile:', err)
            setError(err.message || 'Failed to update profile')
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-purple-900/95 border-2 border-purple-500/60 rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-purple-800/60 transition-colors"
                    disabled={isLoading}
                >
                    <X className="w-5 h-5 text-white" />
                </button>

                {/* Title */}
                <h2 className="text-2xl font-bold text-white mb-6">Edit Profile</h2>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                        <p className="text-red-200 text-sm">{error}</p>
                    </div>
                )}

                {/* Avatar Preview */}
                <div className="mb-6 flex flex-col items-center">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-purple-500/60 bg-purple-800/50">
                            {previewUrl ? (
                                <Image
                                    src={previewUrl}
                                    alt="Avatar preview"
                                    width={96}
                                    height={96}
                                    className="w-full h-full object-cover"
                                    onError={() => setPreviewUrl('')}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-purple-600">
                                    <User className="w-12 h-12 text-white" />
                                </div>
                            )}
                        </div>

                        {/* Camera Upload Button */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 p-2 bg-blue-500 rounded-full hover:bg-blue-600 transition-colors shadow-lg border-2 border-purple-900 group"
                            disabled={isUploading || isLoading}
                            title="Upload new avatar"
                        >
                            <Camera className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                        </button>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>
                    {isUploading && <p className="text-blue-400 text-xs mt-2 animate-pulse">Uploading...</p>}
                </div>



                {/* Name Input */}
                <div className="mb-6">
                    <label className="block text-white font-medium mb-2">
                        Display Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full px-4 py-3 bg-purple-800/50 border-2 border-purple-500/40 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-400/80 transition-colors"
                        disabled={isLoading}
                        maxLength={50}
                    />
                    <p className="text-white/40 text-xs mt-1">{name.length}/50 characters</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-purple-800/50 border-2 border-purple-500/40 rounded-xl text-white font-medium hover:bg-purple-800/70 transition-colors"
                        disabled={isLoading}
                    >
                        Cancel
                    </button >
                    <button
                        onClick={handleSave}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-500 border-2 border-purple-400/60 rounded-xl text-white font-bold hover:from-purple-500 hover:to-purple-400 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div >
            </div >
        </div >
    )
}
