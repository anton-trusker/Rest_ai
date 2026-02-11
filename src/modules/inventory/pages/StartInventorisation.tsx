/**
 * Page: Start Inventorisation
 * 
 * Purpose: Admin page to start a new global inventorisation session
 * - Check permissions
 * - Select location and add notes
 * - Load stock from Syrve
 * - Create global session
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/core/lib/supabase/client'
import { Button } from '@/core/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/ui/card'
import { Input } from '@/core/ui/input'
import { Label } from '@/core/ui/label'
import { Textarea } from '@/core/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/ui/select'
import { Alert, AlertDescription } from '@/core/ui/alert'
import { Loader2, Package, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useGlobalInventorySession } from '../hooks/useGlobalInventorySession'
import { useToast } from '@/core/ui/use-toast'

export default function StartInventorisation() {
    const navigate = useNavigate()
    const { toast } = useToast()
    const { activeSession, canStart, startSession } = useGlobalInventorySession()

    const [locationId, setLocationId] = useState<string>('')
    const [syrveStoreId, setSyrveStoreId] = useState<string>('')
    const [notes, setNotes] = useState<string>('')

    // Fetch locations
    const { data: locations } = useQuery({
        queryKey: ['locations'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('locations')
                .select('*')
                .order('name')

            if (error) throw error
            return data
        },
    })

    // Fetch Syrve connections
    const { data: syrveConnections } = useQuery({
        queryKey: ['syrve-connections'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('syrve_connections')
                .select('*')
                .eq('is_active', true)

            if (error) throw error
            return data
        },
    })

    const handleStart = async () => {
        if (!syrveStoreId) {
            toast({
                title: 'Error',
                description: 'Please select a Syrve store',
                variant: 'destructive',
            })
            return
        }

        try {
            const result = await startSession.mutateAsync({
                location_id: locationId || undefined,
                syrve_store_id: syrveStoreId,
                notes: notes || undefined,
            })

            toast({
                title: 'Success',
                description: `Inventorisation started. Loaded ${result.expected_stock_count} products.`,
            })

            // Navigate to counting interface
            navigate('/inventory/count')
        } catch (error: any) {
            toast({
                title: 'Error starting inventorisation',
                description: error.message,
                variant: 'destructive',
            })
        }
    }

    // Check if user has permission
    if (!canStart) {
        return (
            <div className="container mx-auto p-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        You don't have permission to start inventorisation. Contact your administrator.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    // Check if there's already an active session
    if (activeSession) {
        return (
            <div className="container mx-auto p-6">
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex flex-col gap-4">
                        <p>
                            There is already an active inventorisation session started by another user.
                            Only one inventorisation can run at a time.
                        </p>
                        <div className="flex gap-2">
                            <Button onClick={() => navigate('/inventory/count')}>
                                Go to Active Session
                            </Button>
                            <Button variant="outline" onClick={() => navigate('/inventory')}>
                                Back to Inventory
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Start Inventorisation
                    </CardTitle>
                    <CardDescription>
                        Create a new global inventorisation session. This will load expected stock from Syrve.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Location Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="location">Location (Optional)</Label>
                        <Select value={locationId} onValueChange={setLocationId}>
                            <SelectTrigger id="location">
                                <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent>
                                {locations?.map((location) => (
                                    <SelectItem key={location.id} value={location.id}>
                                        {location.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Syrve Store Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="syrve-store">Syrve Store *</Label>
                        <Select value={syrveStoreId} onValueChange={setSyrveStoreId}>
                            <SelectTrigger id="syrve-store">
                                <SelectValue placeholder="Select Syrve store" />
                            </SelectTrigger>
                            <SelectContent>
                                {syrveConnections?.map((conn) => (
                                    <SelectItem key={conn.id} value={conn.store_id || conn.id}>
                                        {conn.name || `Store ${conn.store_id}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {!syrveConnections || syrveConnections.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                No active Syrve connections found. Please configure Syrve first.
                            </p>
                        )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Add any notes about this inventorisation session..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                        />
                    </div>

                    {/* Info Box */}
                    <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>
                            <strong>What happens next:</strong>
                            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                                <li>Expected stock levels will be loaded from Syrve</li>
                                <li>All users can start counting products</li>
                                <li>Only ONE inventorisation session can be active at a time</li>
                                <li>Changes will be tracked with full audit trail</li>
                            </ul>
                        </AlertDescription>
                    </Alert>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button
                            onClick={handleStart}
                            disabled={startSession.isPending || !syrveStoreId}
                            className="flex-1"
                        >
                            {startSession.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Start Inventorisation
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => navigate('/inventory')}
                            disabled={startSession.isPending}
                        >
                            Cancel
                        </Button>
                    </div>

                    {startSession.error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                {startSession.error.message}
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
