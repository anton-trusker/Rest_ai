import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/core/lib/supabase/client";
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
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StockItem {
    id: string;
    quantity: number;
    quantity_opened: number;
    last_counted_at: string | null;
    products?: {
        name: string;
        unit: string;
        par_level: number | null;
    };
}

export default function CurrentStock() {
    const { data: stock, isLoading } = useQuery({
        queryKey: ['current-stock'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('current_stock')
                .select('*, products(name, unit, par_level)')
                .order('last_counted_at', { ascending: false });

            if (error) throw error;
            return data as StockItem[];
        },
    });

    const getStockStatus = (quantity: number, parLevel: number | null) => {
        if (!parLevel) return null;
        const percentage = (quantity / parLevel) * 100;

        if (percentage >= 80) {
            return <Badge variant="default" className="gap-1"><TrendingUp className="h-3 w-3" /> Good</Badge>;
        } else if (percentage >= 50) {
            return <Badge variant="secondary" className="gap-1"><Minus className="h-3 w-3" /> Medium</Badge>;
        } else {
            return <Badge variant="destructive" className="gap-1"><TrendingDown className="h-3 w-3" /> Low</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Current Stock</h1>
                <p className="text-muted-foreground">
                    Real-time inventory levels from approved counts
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Stock Levels</CardTitle>
                    <CardDescription>
                        Latest counted quantities for all products
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p className="text-center py-8 text-muted-foreground">Loading stock...</p>
                    ) : !stock || stock.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">
                            No stock data yet. Complete and approve an inventory count to see stock levels.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead className="text-right">Par Level</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last Counted</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stock.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.products?.name}</TableCell>
                                        <TableCell className="text-right font-semibold">
                                            {item.quantity + item.quantity_opened} {item.products?.unit}
                                            {item.quantity_opened > 0 && (
                                                <span className="text-xs text-muted-foreground ml-2">
                                                    ({item.quantity} + {item.quantity_opened} opened)
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {item.products?.par_level || '—'}
                                        </TableCell>
                                        <TableCell>
                                            {getStockStatus(item.quantity + item.quantity_opened, item.products?.par_level || null)}
                                        </TableCell>
                                        <TableCell>
                                            {item.last_counted_at
                                                ? new Date(item.last_counted_at).toLocaleDateString()
                                                : 'Never'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
