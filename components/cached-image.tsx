"use client"

import { useState, useEffect, useRef, memo } from 'react'

interface CachedImageProps {
    src: string
    alt: string
    className?: string
    style?: React.CSSProperties
    onLoad?: () => void
    onError?: () => void
    priority?: boolean
}

// In-memory cache for loaded images
const imageCache = new Set<string>()

/**
 * CachedImage component with optimized loading and caching
 * - Uses native lazy loading for below-the-fold images
 * - Decodes images asynchronously to prevent blocking
 * - Tracks loaded images in memory cache
 * - Shows placeholder while loading
 */
export const CachedImage = memo(function CachedImage({
    src,
    alt,
    className = '',
    style,
    onLoad,
    onError,
    priority = false
}: CachedImageProps) {
    const [isLoaded, setIsLoaded] = useState(imageCache.has(src))
    const [hasError, setHasError] = useState(false)
    const imgRef = useRef<HTMLImageElement>(null)

    useEffect(() => {
        // If already in cache, mark as loaded immediately
        if (imageCache.has(src)) {
            setIsLoaded(true)
            return
        }

        // For priority images, preload them
        if (priority && typeof window !== 'undefined') {
            const img = new Image()
            img.onload = () => {
                imageCache.add(src)
                setIsLoaded(true)
            }
            img.onerror = () => setHasError(true)
            img.src = src
        }
    }, [src, priority])

    const handleLoad = () => {
        imageCache.add(src)
        setIsLoaded(true)
        onLoad?.()
    }

    const handleError = () => {
        setHasError(true)
        onError?.()
    }

    if (hasError) {
        // Return a placeholder for errored images
        return (
            <div
                className={`bg-gradient-to-br from-gray-600 to-gray-800 ${className}`}
                style={style}
            />
        )
    }

    return (
        <>
            {/* Placeholder shown while loading */}
            {!isLoaded && (
                <div
                    className={`bg-gradient-to-br from-gray-700 to-gray-900 animate-pulse ${className}`}
                    style={style}
                />
            )}
            {/* Actual image with lazy loading */}
            <img
                ref={imgRef}
                src={src}
                alt={alt}
                loading={priority ? 'eager' : 'lazy'}
                decoding="async"
                onLoad={handleLoad}
                onError={handleError}
                className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                style={{
                    ...style,
                    transition: 'opacity 0.3s ease-in-out',
                }}
            />
        </>
    )
})

/**
 * Preload an array of image URLs into the cache
 */
export function preloadImages(urls: string[]): Promise<void[]> {
    if (typeof window === 'undefined') return Promise.resolve([])

    const loadPromises = urls.map(url => {
        return new Promise<void>((resolve) => {
            if (imageCache.has(url)) {
                resolve()
                return
            }

            const img = new Image()
            img.onload = () => {
                imageCache.add(url)
                resolve()
            }
            img.onerror = () => resolve()
            img.src = url
        })
    })

    return Promise.all(loadPromises)
}

/**
 * Check if an image is in the cache
 */
export function isImageCached(url: string): boolean {
    return imageCache.has(url)
}

/**
 * Clear the image cache
 */
export function clearImageCache(): void {
    imageCache.clear()
}
