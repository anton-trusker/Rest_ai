import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/core/lib/supabase/client";
import { SuperTable } from "@/core/ui/SuperTable/SuperTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/core/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/core/ui/alert";
import { DollarSign, PieChart } from "lucide-react";
import { Skeleton } from "@/core/ui/skeleton";

interface StockValueItem {
    category_name: string;
    item_count: number;
    total_value: number;
}

export function StockValueReport() {
    const { data: session } = useQuery({
        queryKey: ["active-session-for-report"],
        queryFn: async () => {
            const { data, error } = await supabase.rpc("get_active_global_session");
            if (error) throw error;
            if (data && data.length > 0) return data[0];

            const { data: last } = await supabase
                .from("global_inventory_session")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(1)
                .single();
            return last;
        }
    });

    const { data: reportData, isLoading } = useQuery({
        queryKey: ["stock-value-report", session?.id],
        enabled: !!session?.id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("inventory_items")
                .select(`
          quantity,
          products (
            id,
            cost_price,
            categories (name)
          )
        `)
                .eq("global_session_id", session.id);

            if (error) throw error;

            // Group by category
            const categoryMap = new Map<string, StockValueItem>();

            data.forEach((item: any) => {
                const categoryName = item.products.categories?.name ?? "Uncategorized";
                const value = item.quantity * (item.products.cost_price || 0);

                if (!categoryMap.has(categoryName)) {
                    categoryMap.set(categoryName, {
                        category_name: categoryName,
                        item_count: 0,
                        total_value: 0
                    });
                }

                const entry = categoryMap.get(categoryName)!;
                entry.item_count += 1; // Count unique products, or could sum quantity? Let's count products for now.
                entry.total_value += value;
            });

            return Array.from(categoryMap.values()).sort((a, b) => b.total_value - a.total_value);
        }
    });

    if (isLoading) return <Skeleton className="w-full h-96" />;

    if (!session) return <Alert><AlertTitle>No Data</AlertTitle><AlertDescription>No active or past sessions found.</AlertDescription></Alert>;

    const totalValue = reportData?.reduce((acc, item) => acc + item.total_value, 0) || 0;

    const columns = [
        { header: "Category", accessorKey: "category_name" },
        { header: "Products Counted", accessorKey: "item_count" },
        {
            header: "Total Value",
            accessorKey: "total_value",
            cell: ({ row }: any) => {
                const val = row.original.total_value;
                return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
            }
        }
    ];

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalValue)}
                        </div>
                        <p className="text-xs text-muted-foreground">Based on current counts & cost price</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Value by Category</CardTitle>
                    <CardDescription>Breakdown of inventory value across different categories.</CardDescription>
                </CardHeader>
                <CardContent>
                    {reportData && (
                        // @ts-expect-error - SuperTable types need refinement
                        <SuperTable data={reportData} columns={columns} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
