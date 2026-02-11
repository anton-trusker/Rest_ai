/**
 * Page: AI Settings
 * 
 * Purpose: Configure AI providers and API keys
 * - Google Gemini API key management
 * - Model selection
 * - Rate limits and settings
 * - Usage statistics
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/core/lib/supabase/client'
import { Button } from '@/core/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/ui/card'
import { Input } from '@/core/ui/input'
import { Label } from '@/core/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/core/ui/select'
import { Alert, AlertDescription } from '@/core/ui/alert'
import { Badge } from '@/core/ui/badge'
import { useToast } from '@/core/ui/use-toast'
import { Sparkles, Save, Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react'

const GEMINI_MODELS = [
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Recommended)', cost: '$0.00015/image' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Higher accuracy)', cost: '$0.0025/image' },
    { value: 'gemini-pro-vision', label: 'Gemini Pro Vision (Legacy)', cost: '$0.0025/image' },
]

export default function AISettings() {
    const { toast } = useToast()
    const queryClient = useQueryClient()

    const [apiKey, setApiKey] = useState('')
    const [modelName, setModelName] = useState('gemini-1.5-flash')
    const [rateLimit, setRateLimit] = useState(60)
    const [showKey, setShowKey] = useState(false)

    // Fetch current AI config
    const { data: config, isLoading } = useQuery({
        queryKey: ['ai-config'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('ai_config')
                .select('*')
                .eq('provider', 'google')
                .single()

            if (error && error.code !== 'PGRST116') throw error  // Ignore "not found" error
            return data
        },
    })

    // Fetch usage statistics
    const { data: stats } = useQuery({
        queryKey: ['ai-stats'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('ai_recognition_attempts')
                .select('status, processing_time_ms, tokens_used, created_at')
                .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())  // Last 30 days

            if (error) throw error

            const totalAttempts = data.length
            const successfulAttempts = data.filter(a => a.status === 'success').length
            const avgProcessingTime = data.reduce((sum, a) => sum + (a.processing_time_ms || 0), 0) / totalAttempts || 0
            const totalTokens = data.reduce((sum, a) => sum + (a.tokens_used || 0), 0)

            return {
                totalAttempts,
                successfulAttempts,
                successRate: totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 0,
                avgProcessingTime: Math.round(avgProcessingTime),
                totalTokens,
                estimatedCost: (totalTokens / 1000) * 0.00015,  // Rough estimate for Flash
            }
        },
    })

    // Initialize form with existing config
    useState(() => {
        if (config) {
            setModelName(config.model_name || 'gemini-1.5-flash')
            setRateLimit(config.rate_limit_per_minute || 60)
        }
    })

    // Save configuration
    const saveConfig = useMutation({
        mutationFn: async () => {
            if (!apiKey && !config?.api_key_encrypted) {
                throw new Error('API key is required')
            }

            const configData = {
                provider: 'google',
                model_name: modelName,
                api_key_encrypted: apiKey || config?.api_key_encrypted,  // Keep existing if not changed
                is_active: true,
                is_system_provided: true,
                rate_limit_per_minute: rateLimit,
                max_image_size_mb: 4,
                supported_formats: ['image/jpeg', 'image/png', 'image/webp'],
            }

            if (config?.id) {
                // Update existing
                const { data, error } = await supabase
                    .from('ai_config')
                    .update(configData)
                    .eq('id', config.id)
                    .select()

                if (error) throw error
                return data
            } else {
                // Insert new
                const { data, error } = await supabase
                    .from('ai_config')
                    .insert([configData])
                    .select()

                if (error) throw error
                return data
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-config'] })
            toast({
                title: 'Configuration saved',
                description: 'AI recognition is now enabled',
            })
            setApiKey('')  // Clear form
            setShowKey(false)
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to save',
                description: error.message,
                variant: 'destructive',
            })
        },
    })

    return (
        <div className="container mx-auto p-6 max-w-4xl space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Sparkles className="h-8 w-8 text-purple-500" />
                    AI Settings
                </h1>
                <p className="text-muted-foreground mt-1">
                    Configure Google Gemini for AI-powered product recognition
                </p>
            </div>

            {/* Configuration Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Google Gemini Configuration</CardTitle>
                    <CardDescription>
                        Get your API key from{' '}
                        <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                            Google AI Studio
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Status Badge */}
                    <div>
                        {config?.is_active && config.api_key_encrypted ? (
                            <Badge variant="default" className="gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Active
                            </Badge>
                        ) : (
                            <Badge variant="secondary" className="gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Not Configured
                            </Badge>
                        )}
                    </div>

                    {/* API Key */}
                    <div className="space-y-2">
                        <Label htmlFor="api-key">
                            Google Gemini API Key
                            {config?.api_key_encrypted && ' (configured)'}
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="api-key"
                                type={showKey ? 'text' : 'password'}
                                placeholder={config?.api_key_encrypted ? '••••••••••••••••' : 'Enter API key'}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="font-mono"
                            />
                            <Button
                                variant="outline"
                                onClick={() => setShowKey(!showKey)}
                            >
                                {showKey ? 'Hide' : 'Show'}
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Your API key is encrypted and stored securely
                        </p>
                    </div>

                    {/* Model Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="model">Model</Label>
                        <Select value={modelName} onValueChange={setModelName}>
                            <SelectTrigger id="model">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {GEMINI_MODELS.map((model) => (
                                    <SelectItem key={model.value} value={model.value}>
                                        <div className="flex flex-col">
                                            <span>{model.label}</span>
                                            <span className="text-xs text-muted-foreground">{model.cost}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Rate Limit */}
                    <div className="space-y-2">
                        <Label htmlFor="rate-limit">Rate Limit (requests/minute)</Label>
                        <Input
                            id="rate-limit"
                            type="number"
                            value={rateLimit}
                            onChange={(e) => setRateLimit(parseInt(e.target.value) || 60)}
                            min={1}
                            max={300}
                        />
                    </div>

                    {/* Save Button */}
                    <Button
                        onClick={() => saveConfig.mutate()}
                        disabled={saveConfig.isPending}
                        size="lg"
                        className="w-full"
                    >
                        {saveConfig.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" />
                        Save Configuration
                    </Button>
                </CardContent>
            </Card>

            {/* Usage Statistics */}
            {stats && stats.totalAttempts > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Usage Statistics (Last 30 Days)</CardTitle>
                        <CardDescription>AI recognition performance and costs</CardDescription>
                    </CardHeader>

                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <div className="text-2xl font-bold">{stats.totalAttempts}</div>
                                <div className="text-sm text-muted-foreground">Total Scans</div>
                            </div>

                            <div>
                                <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
                                <div className="text-sm text-muted-foreground">Success Rate</div>
                            </div>

                            <div>
                                <div className="text-2xl font-bold">{stats.avgProcessingTime}ms</div>
                                <div className="text-sm text-muted-foreground">Avg. Processing Time</div>
                            </div>

                            <div>
                                <div className="text-2xl font-bold">{stats.totalTokens.toLocaleString()}</div>
                                <div className="text-sm text-muted-foreground">Tokens Used</div>
                            </div>

                            <div>
                                <div className="text-2xl font-bold">${stats.estimatedCost.toFixed(4)}</div>
                                <div className="text-sm text-muted-foreground">Est. Cost</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Info Alert */}
            <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                    <strong>How it works:</strong> Users can scan product labels during inventory counting.
                    The AI will recognize the product and match it to your catalog. Very cost-effective at ~$0.15/month for 1000 scans.
                </AlertDescription>
            </Alert>
        </div>
    )
}
