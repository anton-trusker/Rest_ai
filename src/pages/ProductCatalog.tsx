import { useEffect } from 'react';
import { useProductStore } from '@/stores/productStore';
import { useSyrveStore } from '@/stores/syrveStore';
import CategoryTree from '@/components/catalog/CategoryTree';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Package, Layers, RefreshCw, Barcode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProductCatalog() {
    const {
        products,
        categoryTree,
        fetchCategories,
        fetchProducts,
        selectedCategoryId,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        loading
    } = useProductStore();

    const { config } = useSyrveStore(); // To show sync status
    const navigate = useNavigate();

    useEffect(() => {
        fetchCategories();
        fetchProducts();
    }, []);

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col animate-fade-in">
            {/* Header Stats */}
            <div className="p-6 pb-2 grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-card/50 backdrop-blur">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary"><Package className="h-5 w-5" /></div>
                        <div>
                            <p className="text-xs text-muted-foreground">Total Products</p>
                            <h3 className="text-xl font-bold">{products.length}{loading ? '+' : ''}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card/50 backdrop-blur">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Layers className="h-5 w-5" /></div>
                        <div>
                            <p className="text-xs text-muted-foreground">Categories</p>
                            <h3 className="text-xl font-bold">{useProductStore.getState().categories.length}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex-1 flex overflow-hidden p-6 pt-4 gap-6">
                {/* Sidebar: Categories */}
                <div className="w-64 flex flex-col gap-4">
                    <div className="font-semibold text-lg flex items-center gap-2">
                        <Layers className="w-4 h-4 text-muted-foreground" />
                        Categories
                    </div>
                    <Card className="flex-1 overflow-auto p-3 bg-card/60">
                        <CategoryTree
                            categories={categoryTree}
                            selectedId={selectedCategoryId}
                            onSelect={setSelectedCategory}
                        />
                    </Card>
                </div>

                {/* Main Content: Products */}
                <div className="flex-1 flex flex-col gap-4">
                    {/* Actions Bar */}
                    <div className="flex justify-between items-center bg-card/60 p-3 rounded-lg border border-border/50">
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search products, SKU..."
                                className="pl-9 h-9"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {config?.last_product_sync_at && (
                                <span className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded">
                                    <RefreshCw className="w-3 h-3" />
                                    Synced: {new Date(config.last_product_sync_at).toLocaleDateString()}
                                </span>
                            )}
                            <Button size="sm" onClick={() => navigate('/settings/syrve')}>
                                Sync Config
                            </Button>
                        </div>
                    </div>

                    {/* Product Grid/List */}
                    <div className="flex-1 overflow-auto">
                        {loading ? (
                            <div className="h-40 flex items-center justify-center text-muted-foreground">Loading products...</div>
                        ) : products.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60">
                                <Package className="w-12 h-12 mb-2" />
                                <p>No products found in this category.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {products.map(product => (
                                    <Card key={product.id} className="group hover:border-primary/50 transition-colors">
                                        <CardContent className="p-4 flex flex-col h-full gap-2">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-medium line-clamp-2 min-h-[3rem] text-sm leading-snug" title={product.name}>
                                                    {product.name}
                                                </h3>
                                                {product.image_url ? (
                                                    <img src={product.image_url} className="w-10 h-10 rounded object-cover bg-muted" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                                                        {product.unit_name?.slice(0, 2) || '??'}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-auto flex items-end justify-between pt-2">
                                                <div className="text-xs text-muted-foreground">
                                                    <div>SKU: <span className="font-mono">{product.sku}</span></div>
                                                    <div>Unit: {product.unit_name}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-bold text-primary">
                                                        {product.stock_on_hand || 0}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground uppercase">In Stock</div>
                                                </div>
                                            </div>

                                            {/* Barcode badge if exists */}
                                            <div className="pt-2 border-t border-border/50 flex gap-2">
                                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 gap-1">
                                                    <Barcode className="w-3 h-3" />
                                                    {product.product_type || 'ITEM'}
                                                </Badge>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
