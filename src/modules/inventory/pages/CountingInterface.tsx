import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/core/lib/supabase/client";
import { useAuthStore } from "@/core/auth/authStore";
import { Button } from "@/core/ui/button";
import { Input } from "@/core/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/core/ui/card";
import { Badge } from "@/core/ui/badge";
import { useToast } from "@/core/ui/use-toast";
import { Search, Camera, Plus, Minus, CheckCircle, ArrowLeft } from "lucide-react";
import QuantityPopup from "../components/QuantityPopup";
import { AIRecognitionButton } from "../components/AIRecognitionButton";
import { Skeleton } from "@/core/ui/skeleton";

interface InventoryItem {
    id: string;
    product_id: string;
    quantity: number;
    quantity_opened: number;
    products?: {
        name: string;
        unit: string;
    };
}

export default function CountingInterface() {

    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [showQuantityPopup, setShowQuantityPopup] = useState(false);

    // Fetch session - Global Session context
    const { data: session } = useQuery({
        queryKey: ['global-inventory-session'],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_active_global_session');
            if (error) throw error;
            return data?.[0] || null;
        }
    });

    // Fetch items in this global session
    const { data: items, isLoading: isLoadingItems } = useQuery({
        queryKey: ['inventory-items', session?.id],
        queryFn: async () => {
            if (!session?.id) return [];
            const { data, error } = await supabase
                .from('inventory_items')
                .select('*, products(name, unit)')
                .eq('global_session_id', session.id)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            return data as InventoryItem[];
        },
        enabled: !!session?.id,
    });

    // Search products
    const { data: products } = useQuery({
        queryKey: ['products-search', searchTerm],
        queryFn: async () => {
            if (!searchTerm || searchTerm.length < 2) return [];

            const { data, error } = await supabase
                .from('products')
                .select('*')
                .ilike('name', `%${searchTerm}%`)
                .eq('is_countable', true)
                .limit(10);

            if (error) throw error;
            return data;
        },
        enabled: searchTerm.length >= 2,
    });

    // Add/update item mutation
    const addItemMutation = useMutation({
        mutationFn: async ({ productId, quantity, quantityOpened }: any) => {
            if (!session?.id) throw new Error("No active session");

            const { data, error } = await supabase
                .from('inventory_items')
                .upsert({
                    global_session_id: session.id,
                    product_id: productId,
                    quantity: quantity, // This is "cases" or main unit
                    quantity_opened: quantityOpened || 0, // This is "bottles" or sub unit
                    updated_at: new Date().toISOString(),
                    updated_by: user?.id
                }, { onConflict: 'global_session_id, product_id' })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-items', session?.id] });
            setShowQuantityPopup(false);
            setSelectedProduct(null);
            setSearchTerm("");
            toast({
                title: "Item counted",
                description: "Item saved",
            });
        },
    });

    // Complete session
    const completeSessionMutation = useMutation({
        mutationFn: async () => {
            if (!session?.id) throw new Error("No active session");

            const { error } = await supabase.functions.invoke('complete-inventorisation', {
                body: { session_id: session.id }
            });

            if (error) throw error;
        },
        onSuccess: () => {
            toast({
                title: "Session completed",
                description: "Ready for review",
            });
            navigate(`/inventory/review`);
        },
    });

    const handleProductSelect = (product: any) => {
        setSelectedProduct(product);
        setShowQuantityPopup(true);
    };

    const handleQuantitySave = (quantity: number, quantityOpened: number) => {
        if (selectedProduct) {
            addItemMutation.mutate({
                productId: selectedProduct.id,
                quantity,
                quantityOpened,
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/inventory')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">
                            {session?.session_type && (
                                <span className="capitalize">{session.session_type} </span>
                            )}
                            Count
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {session?.locations?.name}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Badge variant={session?.status === 'in_progress' ? 'default' : 'outline'}>
                        {session?.status}
                    </Badge>
                    {items && items.length > 0 && (
                        <Button onClick={() => completeSessionMutation.mutate()}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Complete & Review
                        </Button>
                    )}
                </div>
            </div>

            {/* Search Bar */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <AIRecognitionButton
                            onProductMatched={(productId, productName) => {
                                // Find the product by ID  and open quantity popup
                                const product = products?.find(p => p.id === productId);
                                if (product) {
                                    handleProductSelect(product);
                                } else {
                                    // Fetch product if not in current results
                                    supabase
                                        .from('products')
                                        .select('*')
                                        .eq('id', productId)
                                        .single()
                                        .then(({ data }) => {
                                            if (data) handleProductSelect(data);
                                        });
                                }
                            }}
                            sessionId={session?.id}
                        />
                    </div>

                    {/* Search Results */}
                    {products && products.length > 0 && (
                        <div className="mt-4 space-y-2">
                            {products.map((product) => (
                                <button
                                    key={product.id}
                                    onClick={() => handleProductSelect(product)}
                                    className="w-full text-left p-3 rounded-lg border hover:bg-muted transition-colors"
                                >
                                    <p className="font-medium">{product.name}</p>
                                    <p className="text-sm text-muted-foreground capitalize">
                                        {product.unit} • SKU: {product.sku || 'N/A'}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Counted Items */}
            <Card>
                <CardHeader>
                    <CardTitle>Counted Items ({items?.length || 0})</CardTitle>
                    <CardDescription>
                        Items counted in this session
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingItems ? (
                        <div className="space-y-4">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    ) : !items || items.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">
                            No items counted yet. Search and add products above.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between p-3 rounded-lg border touch-manipulation"
                                >
                                    <div>
                                        <p className="font-medium">{item.products?.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {item.quantity} {item.products?.unit}
                                            {item.quantity_opened > 0 && ` + ${item.quantity_opened} opened`}
                                        </p>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                // Quick decrement
                                                if (item.quantity > 0) {
                                                    addItemMutation.mutate({
                                                        productId: item.product_id,
                                                        quantity: item.quantity - 1,
                                                        quantityOpened: item.quantity_opened,
                                                    });
                                                }
                                            }}
                                        >
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                // Quick increment
                                                addItemMutation.mutate({
                                                    productId: item.product_id,
                                                    quantity: item.quantity + 1,
                                                    quantityOpened: item.quantity_opened,
                                                });
                                            }}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quantity Popup */}
            {showQuantityPopup && selectedProduct && (
                <QuantityPopup
                    product={selectedProduct}
                    onSave={(qty, open) => {
                        addItemMutation.mutate({
                            productId: selectedProduct.id,
                            quantity: qty,
                            quantityOpened: open
                        });
                    }}
                    onClose={() => {
                        setShowQuantityPopup(false);
                        setSelectedProduct(null);
                    }}
                />
            )}
        </div>
    );
}
