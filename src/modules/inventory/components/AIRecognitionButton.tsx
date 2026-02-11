/**
 * Component: AIRecognitionButton
 * 
 * Purpose: Camera button for AI-powered product recognition
 * - Captures image from camera or file
 * - Sends to AI edge function
 * - Shows match results
 */

import { useState, useRef } from 'react'
import { Camera, Loader2, Sparkles, X } from 'lucide-react'
import { Button } from '@/core/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/core/ui/dialog'
import { Badge } from '@/core/ui/badge'
import { Alert, AlertDescription } from '@/core/ui/alert'
import { useToast } from '@/core/ui/use-toast'
import { useAIRecognition, useAIConfig, compressImage, type AIMatch } from '../hooks/useAIRecognition'

interface AIRecognitionButtonProps {
    onProductMatched: (productId: string, productName: string) => void
    sessionId?: string
    categoryHint?: string
    className?: string
}

export function AIRecognitionButton({
    onProductMatched,
    sessionId,
    categoryHint,
    className,
}: AIRecognitionButtonProps) {
    const { toast } = useToast()
    const { recognizeProduct, isRecognizing } = useAIRecognition()
    const { config, isConfigured } = useAIConfig()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [showMatches, setShowMatches] = useState(false)
    const [matches, setMatches] = useState<AIMatch[]>([])
    const [extractedData, setExtractedData] = useState<any>(null)

    const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Reset file input for re-use
        e.target.value = ''

        try {
            // Compress image
            const base64Image = await compressImage(file, config?.max_image_size_mb || 4)

            // Call AI recognition
            const result = await recognizeProduct.mutateAsync({
                image: base64Image,
                sessionId,
                context: {
                    categoryHint,
                },
            })

            setExtractedData(result.extracted_data)
            setMatches(result.matches)

            // Auto-select if high confidence
            if (result.matches.length > 0 && result.matches[0].confidence > 85) {
                const bestMatch = result.matches[0]
                toast({
                    title: 'Product recognized!',
                    description: `${bestMatch.product_name} (${bestMatch.confidence}% confidence)`,
                })
                onProductMatched(bestMatch.product_id, bestMatch.product_name)
            } else if (result.matches.length > 0) {
                // Show matches dialog for manual selection
                setShowMatches(true)
            } else {
                toast({
                    title: 'No matches found',
                    description: `Detected: ${result.extracted_data.product_name || 'Unknown product'}. Try manual search.`,
                    variant: 'destructive',
                })
            }
        } catch (error: any) {
            console.error('AI recognition error:', error)
            toast({
                title: 'Recognition failed',
                description: error.message || 'Failed to process image',
                variant: 'destructive',
            })
        }
    }

    const handleMatchSelect = (match: AIMatch) => {
        onProductMatched(match.product_id, match.product_name)
        setShowMatches(false)
        toast({
            title: 'Product selected',
            description: match.product_name,
        })
    }

    if (!isConfigured) {
        return null  // Don't show button if AI is not configured
    }

    return (
        <>
            <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isRecognizing}
                variant="outline"
                size="lg"
                className={className}
            >
                {isRecognizing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                )}
                AI Scan
            </Button>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageCapture}
                className="hidden"
            />

            {/* Match Results Dialog */}
            <Dialog open={showMatches} onOpenChange={setShowMatches}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>AI Recognition Results</DialogTitle>
                        <DialogDescription>
                            {extractedData?.product_name && (
                                <span className="block mt-1">
                                    Detected: <strong>{extractedData.product_name}</strong>
                                    {extractedData.brand && ` by ${extractedData.brand}`}
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {matches.map((match) => (
                            <button
                                key={match.product_id}
                                onClick={() => handleMatchSelect(match)}
                                className="w-full p-3 text-left rounded-lg border hover:bg-accent transition-colors flex items-center justify-between"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{match.product_name}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {match.sku && `SKU: ${match.sku}`}
                                        {match.category && ` • ${match.category}`}
                                    </div>
                                </div>
                                <Badge
                                    variant={match.confidence > 70 ? 'default' : 'secondary'}
                                    className="ml-2 shrink-0"
                                >
                                    {match.confidence}%
                                </Badge>
                            </button>
                        ))}

                        {matches.length === 0 && (
                            <Alert>
                                <AlertDescription>
                                    No matching products found in catalog. Try manual search or add new product.
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>

                    <Button variant="outline" onClick={() => setShowMatches(false)} className="w-full">
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                    </Button>
                </DialogContent>
            </Dialog>
        </>
    )
}
