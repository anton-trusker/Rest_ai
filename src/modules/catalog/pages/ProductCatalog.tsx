import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/core/lib/supabase/client";
import { Button } from "@/core/ui/button";
import { Input } from "@/core/ui/input";
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
import { Search, Plus, Download, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

interface Product {
    id: string;
    name: string;
    sku: string | null;
    category_id: string | null;
    purchase_price: number | null;
    unit: string;
    is_countable: boolean;
    synced_at: string | null;
}

export default function ProductCatalog() {
    const [searchTerm, setSearchTerm] = useState("");

    const { data: products, isLoading, refetch } = useQuery({
        queryKey: ['products', searchTerm],
        queryFn: async () => {
            let query = supabase
                .from('products')
                .select('*')
                .order('name', { ascending: true });

            if (searchTerm) {
                query = query.ilike('name', `%${searchTerm}%`);
            }

            const { data, error } = await query.limit(100);

            if (error) throw error;
            return data as Product[];
        },
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Product Catalog</h1>
                    <p className="text-muted-foreground">
                        All products synced from Syrve
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => refetch()}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Product
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product Name</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        Loading products...
                                    </TableCell>
                                </TableRow>
                            ) : !products || products.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No products found. Sync from Syrve to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                products.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-medium">
                                            <Link
                                                to={`/catalog/${product.id}`}
                                                className="hover:underline"
                                            >
                                                {product.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {product.sku || '—'}
                                        </TableCell>
                                        <TableCell className="capitalize">{product.unit}</TableCell>
                                        <TableCell>
                                            {product.purchase_price
                                                ? `$${product.purchase_price.toFixed(2)}`
                                                : '—'}
                                        </TableCell>
                                        <TableCell>
                                            {product.is_countable ? (
                                                <Badge variant="default">Active</Badge>
                                            ) : (
                                                <Badge variant="secondary">Inactive</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link to={`/catalog/${product.id}`}>
                                                    View
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {products && products.length > 0 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Showing {products.length} products</span>
                    {products.length === 100 && (
                        <span>Showing first 100 results. Use search to narrow down.</span>
                    )}
                </div>
            )}
        </div>
    );
}
