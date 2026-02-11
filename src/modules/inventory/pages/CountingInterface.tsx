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
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [showQuantityPopup, setShowQuantityPopup] = useState(false);

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

    // Fetch items in this session
    const { data: items } = useQuery({
        queryKey: ['inventory-items', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('inventory_items')
                .select('*, products(name, unit)')
                .eq('session_id', id)
                .order('counted_at', { ascending: false });

            if (error) throw error;
            return data as InventoryItem[];
        },
        enabled: !!id,
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
            const { data, error } = await supabase
                .from('inventory_items')
                .upsert({
                    session_id: id,
                    product_id: productId,
                    location_id: session?.location_id,
                    quantity,
                    quantity_opened: quantityOpened || 0,
                    counted_by: user?.id,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-items', id] });
            setShowQuantityPopup(false);
            setSelectedProduct(null);
            setSearchTerm("");
            toast({
                title: "Item counted",
                description: "Item added to session",
            });
        },
    });

    // Complete session
    const completeSessionMutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from('inventory_sessions')
                .update({ status: 'completed', completed_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            toast({
                title: "Session completed",
                description: "Ready for review",
            });
            navigate(`/inventory/session/${id}/review`);
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
                        <Button variant="outline" size="icon">
                            <Camera className="h-4 w-4" />
                        </Button>
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
                    {!items || items.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">
                            No items counted yet. Search and add products above.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between p-3 rounded-lg border"
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
                    onSave={handleQuantitySave}
                    onClose={() => {
                        setShowQuantityPopup(false);
                        setSelectedProduct(null);
                    }}
                />
            )}
        </div>
    );
}
