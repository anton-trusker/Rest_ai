/**
 * Hook: useAIRecognition
 * 
 * Purpose: Manage AI product recognition
 * - Call AI edge function
 * - Handle image processing
 * - Return matches with confidence scores
 */

import { useMutation, useQuery } from '@tanstack/react-query'
import { supabase } from '@/core/lib/supabase/client'

export interface AIRecognitionRequest {
    image: string  // Base64 or URL
    sessionId?: string
    context?: {
        categoryHint?: string
        locationId?: string
    }
}

export interface AIMatch {
    product_id: string
    product_name: string
    confidence: number
    sku?: string
    code?: string
    category?: string
}

export interface AIRecognitionResult {
    attempt_id: string
    matches: AIMatch[]
    extracted_data: {
        product_name?: string
        brand?: string
        type?: string
        volume?: string
        alcohol_percentage?: string
        vintage?: string
        country?: string
        confidence?: number
    }
    processing_time_ms: number
    tokens_used?: number
}

export function useAIRecognition() {
    const recognizeProduct = useMutation({
        mutationFn: async (request: AIRecognitionRequest): Promise<AIRecognitionResult> => {
            const { data, error } = await supabase.functions.invoke('ai-recognize-product', {
                body: request,
            })

            if (error) {
                throw new Error(error.message || 'AI recognition failed')
            }

            if (data.error) {
                throw new Error(data.error)
            }

            return data as AIRecognitionResult
        },
    })

    return {
        recognizeProduct,
        isRecognizing: recognizeProduct.isPending,
        error: recognizeProduct.error,
    }
}

/**
 * Hook: useAIConfig
 * 
 * Purpose: Manage AI configuration
 */

export interface AIConfig {
    id: string
    provider: string
    model_name: string
    is_active: boolean
    is_system_provided: boolean
    rate_limit_per_minute: number
    max_image_size_mb: number
    supported_formats: string[]
}

export function useAIConfig() {
    const { data: config, isLoading } = useQuery({
        queryKey: ['ai-config'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('ai_config')
                .select('*')
                .eq('is_active', true)
                .eq('provider', 'google')
                .single()

            if (error) throw error
            return data as AIConfig
        },
    })

    return {
        config,
        isLoading,
        isConfigured: !!config?.id,
    }
}

/**
 * Utility: Convert File to Base64
 */
export async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}

/**
 * Utility: Compress image before sending
 */
export async function compressImage(
    file: File,
    maxSizeMB: number = 4
): Promise<string> {
    // If file is already small enough, return as-is
    if (file.size / 1024 / 1024 <= maxSizeMB) {
        return fileToBase64(file)
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement('canvas')
                let width = img.width
                let height = img.height

                // Calculate new dimensions while maintaining aspect ratio
                const maxDimension = 1920
                if (width > height && width > maxDimension) {
                    height = (height * maxDimension) / width
                    width = maxDimension
                } else if (height > maxDimension) {
                    width = (width * maxDimension) / height
                    height = maxDimension
                }

                canvas.width = width
                canvas.height = height

                const ctx = canvas.getContext('2d')
                ctx?.drawImage(img, 0, 0, width, height)

                // Compress to JPEG with quality adjustment
                let quality = 0.8
                let base64 = canvas.toDataURL('image/jpeg', quality)

                // Further reduce quality if still too large
                while (base64.length / 1024 / 1024 > maxSizeMB && quality > 0.1) {
                    quality -= 0.1
                    base64 = canvas.toDataURL('image/jpeg', quality)
                }

                resolve(base64)
            }
            img.onerror = reject
            img.src = e.target?.result as string
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}
