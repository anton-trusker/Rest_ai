/**
 * Page: InventoryCount (Overview)
 * 
 * Purpose: Main inventory page showing global session status
 * - Display global session card if active
 * - Show "Start Inventorisation" button for admins
 * - Navigate to counting interface or review
 */

import { useNavigate } from 'react-router-dom'
import { Button } from '@/core/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/ui/card'
import { Alert, AlertDescription } from '@/core/ui/alert'
import { Badge } from '@/core/ui/badge'
import {
    Package,
    Play,
    ClipboardCheck,
    Clock,
    User,
    MapPin,
    AlertCircle,
    CheckCircle2,
    BarChart3
} from 'lucide-react'
import { useGlobalInventorySession } from '../hooks/useGlobalInventorySession'
import { formatDistance } from 'date-fns'

export default function InventoryCount() {
    const navigate = useNavigate()
    const { activeSession, canStart, isLoading } = useGlobalInventorySession()

    if (isLoading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        )
    }

    const statusConfig = {
        preparing: { label: 'Preparing', variant: 'secondary' as const, icon: Clock },
        active: { label: 'Active', variant: 'default' as const, icon: Play },
        review: { label: 'Under Review', variant: 'outline' as const, icon: ClipboardCheck },
        approved: { label: 'Approved', variant: 'success' as const, icon: CheckCircle2 },
        cancelled: { label: 'Cancelled', variant: 'destructive' as const, icon: AlertCircle },
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
                    <p className="text-muted-foreground">
                        {activeSession
                            ? 'Global inventorisation session in progress'
                            : 'No active inventorisation session'}
                    </p>
                </div>

                {/* Action Buttons */}
                {!activeSession && canStart && (
                    <Button
                        onClick={() => navigate('/inventory/start')}
                        size="lg"
                    >
                        <Play className="mr-2 h-4 w-4" />
                        Start Inventorisation
                    </Button>
                )}
            </div>

            {/* Active Session Card */}
            {activeSession ? (
                <Card className="border-2 border-primary/50">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <Package className="h-6 w-6 text-primary" />
                                <div>
                                    <CardTitle>Global Inventorisation Session</CardTitle>
                                    <CardDescription>
                                        Started {formatDistance(new Date(activeSession.started_at), new Date(), { addSuffix: true })}
                                    </CardDescription>
                                </div>
                            </div>
                            <Badge variant={statusConfig[activeSession.status].variant}>
                                {statusConfig[activeSession.status].label}
                            </Badge>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Session Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-muted-foreground">Started by</p>
                                    <p className="font-medium">User #{activeSession.started_by.substring(0, 8)}</p>
                                </div>
                            </div>

                            {activeSession.location_id && (
                                <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-muted-foreground">Location</p>
                                        <p className="font-medium">Location ID: {activeSession.location_id.substring(0, 8)}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-2 text-sm">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-muted-foreground">Products</p>
                                    <p className="font-medium">{activeSession.expected_stock_count} items loaded</p>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        {activeSession.notes && (
                            <div className="bg-muted p-4 rounded-lg">
                                <p className="text-sm text-muted-foreground mb-1">Notes</p>
                                <p>{activeSession.notes}</p>
                            </div>
                        )}

                        {/* Action Buttons Based on Status */}
                        <div className="flex gap-3">
                            {activeSession.status === 'active' && (
                                <>
                                    <Button
                                        onClick={() => navigate('/inventory/count')}
                                        size="lg"
                                        className="flex-1"
                                    >
                                        <ClipboardCheck className="mr-2 h-4 w-4" />
                                        Continue Counting
                                    </Button>
                                    {canStart && (
                                        <Button
                                            onClick={() => navigate('/inventory/review')}
                                            variant="outline"
                                            size="lg"
                                        >
                                            <BarChart3 className="mr-2 h-4 w-4" />
                                            Review Progress
                                        </Button>
                                    )}
                                </>
                            )}

                            {activeSession.status === 'review' && (
                                <Button
                                    onClick={() => navigate('/inventory/review')}
                                    size="lg"
                                    className="flex-1"
                                >
                                    <BarChart3 className="mr-2 h-4 w-4" />
                                    Review & Approve
                                </Button>
                            )}

                            {activeSession.status === 'approved' && (
                                <Alert>
                                    <CheckCircle2 className="h-4 w-4" />
                                    <AlertDescription>
                                        Inventorisation completed and approved.
                                        {activeSession.syrve_document_number && (
                                            <> Document: <strong>{activeSession.syrve_document_number}</strong></>
                                        )}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                /* No Active Session */
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Package className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Active Inventorisation</h3>
                        <p className="text-muted-foreground mb-6 max-w-md">
                            {canStart
                                ? 'Start a new global inventorisation session to begin counting products.'
                                : 'Wait for an administrator to start an inventorisation session.'}
                        </p>
                        {canStart ? (
                            <Button onClick={() => navigate('/inventory/start')} size="lg">
                                <Play className="mr-2 h-4 w-4" />
                                Start New Session
                            </Button>
                        ) : (
                            <Alert className="max-w-md">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    You don't have permission to start inventorisation. Contact your administrator.
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => navigate('/inventory/history')}>
                    <CardHeader>
                        <CardTitle className="text-lg">History</CardTitle>
                        <CardDescription>View past inventorisation sessions</CardDescription>
                    </CardHeader>
                </Card>

                <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => navigate('/inventory/stock')}>
                    <CardHeader>
                        <CardTitle className="text-lg">Current Stock</CardTitle>
                        <CardDescription>View current inventory levels</CardDescription>
                    </CardHeader>
                </Card>

                <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => navigate('/reports')}>
                    <CardHeader>
                        <CardTitle className="text-lg">Reports</CardTitle>
                        <CardDescription>Generate inventory reports</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </div>
    )
}
