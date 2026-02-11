import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/core/lib/supabase/client";
import { SuperTable } from "@/core/ui/SuperTable/SuperTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/core/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/core/ui/alert";
import { TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/core/ui/skeleton";

interface VarianceItem {
    product_id: string;
    product_name: string;
    category_name: string;
    expected_amount: number;
    counted_amount: number;
    variance: number;
    variance_value: number; // variance * cost_price
    unit: string;
}

export function VarianceReport() {
    const [sessionId, setSessionId] = useState<string | null>(null);

    // Fetch active or last completed session
    const { data: session } = useQuery({
        queryKey: ["active-session-for-report"],
        queryFn: async () => {
            const { data, error } = await supabase.rpc("get_active_global_session");
            if (error) throw error;
            if (data && data.length > 0) return data[0];

            // If no active, get last completed
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
        queryKey: ["variance-report", session?.id],
        enabled: !!session?.id,
        queryFn: async () => {
            // Logic to join inventory_items with expected_stock
            // This would ideally be a database view or RPC
            const { data, error } = await supabase
                .from("inventory_items")
                .select(`
          quantity,
          expected_amount,
          variance,
          products (
            id,
            name,
            cost_price,
            main_unit,
            categories (name)
          )
        `)
                .eq("global_session_id", session.id)
                .neq("variance", 0); // Only show items with variance

            if (error) throw error;

            return data.map((item: {
                quantity: number;
                expected_amount: number | null;
                variance: number | null;
                products: { id: string; name: string; cost_price: number | null; main_unit: string; categories: { name: string } | null }
            }) => ({
                product_id: item.products.id,
                product_name: item.products.name,
                category_name: item.products.categories?.name ?? "Uncategorized",
                expected_amount: item.expected_amount || 0,
                counted_amount: item.quantity,
                variance: item.variance || 0,
                variance_value: (item.variance || 0) * (item.products.cost_price || 0),
                unit: item.products.main_unit
            })) as VarianceItem[];
        }
    });

    if (isLoading) return <Skeleton className="w-full h-96" />;

    if (!session) return <Alert><AlertTitle>No Data</AlertTitle><AlertDescription>No active or past sessions found.</AlertDescription></Alert>;

    const totalVarianceValue = reportData?.reduce((acc, item) => acc + item.variance_value, 0) || 0;

    const columns = [
        { header: "Product", accessorKey: "product_name" },
        { header: "Category", accessorKey: "category_name" },
        { header: "Expected", accessorKey: "expected_amount" },
        { header: "Counted", accessorKey: "counted_amount" },
        {
            header: "Variance",
            accessorKey: "variance",
            cell: ({ row }: { row: { original: VarianceItem } }) => {
                const val = row.original.variance;
                return (
                    <span className={val < 0 ? "text-destructive font-bold" : "text-green-600 font-bold"}>
                        {val > 0 ? "+" : ""}{val} {row.original.unit}
                    </span>
                );
            }
        },
        {
            header: "Value Impact",
            accessorKey: "variance_value",
            cell: ({ row }: { row: { original: VarianceItem } }) => {
                const val = row.original.variance_value;
                return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
            }
        }
    ];

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Variance Value</CardTitle>
                        {totalVarianceValue < 0 ? <TrendingDown className="h-4 w-4 text-destructive" /> : <TrendingUp className="h-4 w-4 text-green-600" />}
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${totalVarianceValue < 0 ? "text-destructive" : "text-green-600"}`}>
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalVarianceValue)}
                        </div>
                        <p className="text-xs text-muted-foreground">Net financial impact of discrepancies</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Discrepancy Detail</CardTitle>
                    <CardDescription>Items where counted amount matches expectation are hidden.</CardDescription>
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
