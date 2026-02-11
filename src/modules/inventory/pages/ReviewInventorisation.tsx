/**
 * Page: ReviewInventorisation
 * 
 * Purpose: Review variance and approve inventorisation
 * - Show variance table (expected vs counted)
 * - Calculate statistics
 * - Approve & submit to Syrve
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/core/lib/supabase/client'
import { Button } from '@/core/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/ui/card'
import { Alert, AlertDescription } from '@/core/ui/alert'
import { Badge } from '@/core/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/core/ui/table'
import {
    CheckCircle2,
    ArrowLeft,
    AlertCircle,
    TrendingUp,
    TrendingDown,
    Loader2,
    Send
} from 'lucide-react'
import { useGlobalInventorySession, useExpectedStock } from '../hooks/useGlobalInventorySession'
import { useToast } from '@/core/ui/use-toast'

export default function ReviewInventorisation() {
    const navigate = useNavigate()
    const { toast } = useToast()
    const { activeSession, completeSession, approveSession } = useGlobalInventorySession()
    const { expectedStock } = useExpectedStock(activeSession?.id)
    const [isApproving, setIsApproving] = useState(false)

    // Fetch inventory items with variance
    const { data: items, isLoading } = useQuery({
        queryKey: ['inventory-items', activeSession?.id],
        queryFn: async () => {
            if (!activeSession?.id) return []

            const { data, error } = await supabase
                .from('inventory_items')
                .select(`
          *,
          product:products (
            id,
            name,
            sku
          )
        `)
                .eq('global_session_id', activeSession.id)
                .order('product(name)')

            if (error) throw error
            return data
        },
        enabled: !!activeSession?.id,
    })

    if (!activeSession) {
        return (
            <div className="container mx-auto p-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        No active session found. Please start an inventorisation session first.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    // Calculate statistics
    const stats = items?.reduce((acc, item) => {
        const expected = item.expected_amount || 0
        const counted = item.total_amount || 0
        const variance = item.variance || 0

        acc.totalProducts++
        acc.totalExpected += expected
        acc.totalCounted += counted
        acc.totalVariance += variance

        if (Math.abs(item.variance_percentage || 0) > 10) {
            acc.highVarianceCount++
        }

        return acc
    }, {
        totalProducts: 0,
        totalExpected: 0,
        totalCounted: 0,
        totalVariance: 0,
        highVarianceCount: 0,
    }) || {}

    const overallVariancePercent = stats.totalExpected > 0
        ? ((stats.totalCounted - stats.totalExpected) / stats.totalExpected) * 100
        : 0

    const handleComplete = async () => {
        if (activeSession.status === 'active') {
            try {
                await completeSession.mutateAsync(activeSession.id)
                toast({
                    title: 'Session marked for review',
                    description: 'Ready for final approval',
                })
            } catch (error: unknown) {
                const err = error as Error;
                toast({
                    title: 'Error',
                    description: err.message,
                    variant: 'destructive',
                })
            }
        }
    }

    const handleApprove = async () => {
        const confirmation = confirm(
            'Are you sure you want to approve and submit this inventorisation to Syrve? This action cannot be undone.'
        )

        if (!confirmation) return

        setIsApproving(true)
        try {
            const result = await approveSession.mutateAsync(activeSession.id)

            toast({
                title: 'Success!',
                description: result.syrve_status === 'submitted'
                    ? 'Inventorisation approved and submitted to Syrve'
                    : 'Approved locally. Syrve submission will be retried.',
            })

            navigate('/inventory')
        } catch (error: unknown) {
            const err = error as Error;
            toast({
                title: 'Error approving inventorisation',
                description: err.message,
                variant: 'destructive',
            })
        } finally {
            setIsApproving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="container mx-auto p-6 flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/inventory')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Review Inventorisation</h1>
                            <p className="text-muted-foreground">
                                Variance analysis and final approval
                            </p>
                        </div>
                    </div>
                </div>

                <Badge variant={activeSession.status === 'review' ? 'default' : 'secondary'}>
                    {activeSession.status}
                </Badge>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Total Products</CardDescription>
                        <CardTitle className="text-3xl">{stats.totalProducts}</CardTitle>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Expected</CardDescription>
                        <CardTitle className="text-3xl">{stats.totalExpected.toFixed(2)}</CardTitle>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Counted</CardDescription>
                        <CardTitle className="text-3xl">{stats.totalCounted.toFixed(2)}</CardTitle>
                    </CardHeader>
                </Card>

                <Card className={overallVariancePercent > 0 ? 'border-green-500' : 'border-red-500'}>
                    <CardHeader className="pb-3">
                        <CardDescription className="flex items-center gap-1">
                            Variance
                            {overallVariancePercent > 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                        </CardDescription>
                        <CardTitle className={`text-3xl ${overallVariancePercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {overallVariancePercent.toFixed(2)}%
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* High Variance Alert */}
            {stats.highVarianceCount > 0 && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        <strong>{stats.highVarianceCount} products</strong> have variance exceeding 10%.
                        Please review these items carefully before approving.
                    </AlertDescription>
                </Alert>
            )}

            {/* Variance Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Product Variance Details</CardTitle>
                    <CardDescription>Expected vs Counted amounts</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead className="text-right">Expected</TableHead>
                                <TableHead className="text-right">Counted</TableHead>
                                <TableHead className="text-right">Variance</TableHead>
                                <TableHead className="text-right">%</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items?.map((item) => {
                                const variancePercent = Math.abs(item.variance_percentage || 0)
                                const isHighVariance = variancePercent > 10

                                return (
                                    <TableRow key={item.id} className={isHighVariance ? 'bg-red-50' : ''}>
                                        <TableCell className="font-medium">
                                            {item.product?.name}
                                            {item.product?.sku && (
                                                <span className="text-muted-foreground ml-2 text-sm">
                                                    ({item.product.sku})
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {(item.expected_amount || 0).toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">
                                            {(item.total_amount || 0).toFixed(2)}
                                        </TableCell>
                                        <TableCell className={`text-right font-semibold ${(item.variance || 0) > 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {(item.variance || 0) > 0 ? '+' : ''}
                                            {(item.variance || 0).toFixed(2)}
                                        </TableCell>
                                        <TableCell className={`text-right ${isHighVariance ? 'text-red-600 font-bold' : 'text-muted-foreground'
                                            }`}>
                                            {(item.variance_percentage || 0).toFixed(2)}%
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-3">
                        {activeSession.status === 'active' && (
                            <>
                                <Button
                                    onClick={handleComplete}
                                    disabled={completeSession.isPending}
                                    size="lg"
                                    className="flex-1"
                                >
                                    {completeSession.isPending && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Mark as Complete
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => navigate('/inventory/count')}
                                    size="lg"
                                >
                                    Back to Counting
                                </Button>
                            </>
                        )}

                        {activeSession.status === 'review' && (
                            <>
                                <Button
                                    onClick={handleApprove}
                                    disabled={isApproving || approveSession.isPending}
                                    size="lg"
                                    className="flex-1"
                                    variant="default"
                                >
                                    {(isApproving || approveSession.isPending) && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    <Send className="mr-2 h-4 w-4" />
                                    Approve & Submit to Syrve
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => navigate('/inventory/count')}
                                    size="lg"
                                    disabled={isApproving || approveSession.isPending}
                                >
                                    Return to Counting
                                </Button>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
