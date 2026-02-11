import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/core/lib/supabase/client";
import { useAuthStore } from "@/core/auth/authStore";
import { Button } from "@/core/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/core/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/core/ui/table";
import { Badge } from "@/core/ui/badge";
import { useToast } from "@/core/ui/use-toast";
import { ArrowLeft, CheckCircle, XCircle, Send } from "lucide-react";

export default function SessionReview() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch session
    const { data: session } = useQuery({
        queryKey: ['inventory-session', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('inventory_sessions')
                .select('*, locations(name)')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!id,
    });

    // Fetch items
    const { data: items } = useQuery({
        queryKey: ['inventory-items', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('inventory_items')
                .select('*, products(name, unit, purchase_price)')
                .eq('session_id', id);

            if (error) throw error;
            return data;
        },
        enabled: !!id,
    });

    // Approve session
    const approveMutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from('inventory_sessions')
                .update({
                    status: 'approved',
                    approved_by: user?.id,
                    approved_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-session', id] });
            toast({
                title: "Session approved",
                description: "Stock levels have been updated",
            });
        },
    });

    const totalItems = items?.length || 0;
    const totalValue = items?.reduce((sum, item) => {
        const price = item.products?.purchase_price || 0;
        return sum + (price * (item.quantity + item.quantity_opened));
    }, 0) || 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/inventory')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Session Review</h1>
                        <p className="text-sm text-muted-foreground">
                            {session?.locations?.name} • {new Date(session?.started_at || '').toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <Badge variant={session?.status === 'approved' ? 'default' : 'outline'}>
                    {session?.status}
                </Badge>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Items</CardDescription>
                        <CardTitle className="text-3xl">{totalItems}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Estimated Value</CardDescription>
                        <CardTitle className="text-3xl">${totalValue.toFixed(2)}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Session Type</CardDescription>
                        <CardTitle className="text-3xl capitalize">{session?.session_type}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Items Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Counted Items</CardTitle>
                    <CardDescription>
                        Review all items before approving
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead className="text-right">Full</TableHead>
                                <TableHead className="text-right">Opened</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right">Value</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items?.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.products?.name}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right">
                                        {item.quantity_opened > 0 ? item.quantity_opened : '—'}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {item.quantity + item.quantity_opened} {item.products?.unit}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        ${((item.products?.purchase_price || 0) * (item.quantity + item.quantity_opened)).toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Actions */}
            {session?.status === 'completed' && (
                <Card>
                    <CardContent className="flex gap-3 p-6">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => navigate(`/inventory/session/${id}`)}
                        >
                            <XCircle className="mr-2 h-4 w-4" />
                            Back to Counting
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={() => approveMutation.mutate()}
                        >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve & Update Stock
                        </Button>
                    </CardContent>
                </Card>
            )}

            {session?.status === 'approved' && (
                <Card>
                    <CardContent className="flex gap-3 p-6">
                        <Button
                            className="flex-1"
                            onClick={() => toast({ title: "Coming in Phase 5", description: "Syrve integration" })}
                        >
                            <Send className="mr-2 h-4 w-4" />
                            Send to Syrve
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
