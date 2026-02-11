import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/core/lib/supabase/client";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/core/ui/card";
import { Badge } from "@/core/ui/badge";
import { Separator } from "@/core/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/ui/tabs";

interface Product {
    id: string;
    syrve_id: string | null;
    name: string;
    sku: string | null;
    code: string | null;
    unit: string;
    unit_capacity: number | null;
    purchase_price: number | null;
    description: string | null;
    image_url: string | null;
    par_level: number | null;
    is_countable: boolean;
    metadata: Record<string, unknown> | null;
    syrve_data: Record<string, unknown> | null;
    synced_at: string | null;
    created_at: string;
}

export default function ProductDetail() {
    const { id } = useParams<{ id: string }>();

    const { data: product, isLoading } = useQuery({
        queryKey: ['product', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data as Product;
        },
        enabled: !!id,
    });

    if (isLoading) {
        return <div className="p-8">Loading product...</div>;
    }

    if (!product) {
        return <div className="p-8">Product not found</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
                    <p className="text-muted-foreground mt-2">
                        SKU: {product.sku || 'N/A'} • Code: {product.code || 'N/A'}
                    </p>
                </div>
                <Badge variant={product.is_countable ? "default" : "secondary"}>
                    {product.is_countable ? "Active" : "Inactive"}
                </Badge>
            </div>

            <Tabs defaultValue="info" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="info">Information</TabsTrigger>
                    <TabsTrigger value="syrve">Syrve Data</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Product Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Unit</p>
                                    <p className="text-base capitalize">{product.unit}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Unit Capacity</p>
                                    <p className="text-base">{product.unit_capacity || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Purchase Price</p>
                                    <p className="text-base">
                                        {product.purchase_price ? `$${product.purchase_price.toFixed(2)}` : '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Par Level</p>
                                    <p className="text-base">{product.par_level || '—'}</p>
                                </div>
                            </div>

                            {product.description && (
                                <>
                                    <Separator />
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                                        <p className="text-base">{product.description}</p>
                                    </div>
                                </>
                            )}

                            {product.metadata && Object.keys(product.metadata).length > 0 && (
                                <>
                                    <Separator />
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-2">Additional Info</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.entries(product.metadata).map(([key, value]) => (
                                                <div key={key}>
                                                    <span className="text-sm text-muted-foreground capitalize">
                                                        {key.replace(/_/g, ' ')}:
                                                    </span>
                                                    <span className="text-sm ml-2">{String(value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="syrve" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Syrve Synchronization</CardTitle>
                            <CardDescription>
                                Data synced from Syrve (iiko) system
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Syrve ID</p>
                                    <p className="text-base font-mono text-xs">{product.syrve_id || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Last Synced</p>
                                    <p className="text-base">
                                        {product.synced_at
                                            ? new Date(product.synced_at).toLocaleString()
                                            : 'Never'}
                                    </p>
                                </div>
                            </div>

                            {product.syrve_data && Object.keys(product.syrve_data).length > 0 && (
                                <>
                                    <Separator />
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-2">Raw Syrve Data</p>
                                        <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-96">
                                            {JSON.stringify(product.syrve_data, null, 2)}
                                        </pre>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Inventory History</CardTitle>
                            <CardDescription>
                                Recent counting and stock movements
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                No history available yet. Inventory tracking will be implemented in Phase 4.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
