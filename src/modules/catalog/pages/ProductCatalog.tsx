import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockWines, Wine } from '@/core/lib/mockData';
import { useAuthStore } from '@/core/auth/authStore';
import { useColumnStore } from '@/core/settings/columnStore';
import { Search, Plus, SlidersHorizontal, LayoutGrid, Table2, Wine as WineIcon, ImageOff, X, FileUp } from 'lucide-react';
import { Input } from '@/core/ui/input';
import { Button } from '@/core/ui/button';
import { Slider } from '@/core/ui/slider';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/core/ui/select';
import ColumnManager from '@/core/ui/ColumnManager';
import FilterManager from '@/core/ui/FilterManager';
import MultiSelectFilter from '@/core/ui/MultiSelectFilter';
import DataTable, { DataTableColumn } from '@/core/ui/DataTable';

type ViewMode = 'grid' | 'table';

export default function ProductCatalog() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { catalogColumns, catalogFilters, setColumnWidth, columnWidths, setCatalogColumns, setCatalogFilters } = useColumnStore();

    const [viewMode, setViewMode] = useState<ViewMode>('table');
    const [search, setSearch] = useState('');

    // Filters state
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
    const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
    const [stockRange, setStockRange] = useState<[number, number]>([0, 100]);
    const [sortBy, setSortBy] = useState('name-asc');
    const [showFilters, setShowFilters] = useState(false);

    // Derived filter options
    const allTypes = Array.from(new Set(mockWines.map(w => w.type))).sort();
    const allCountries = Array.from(new Set(mockWines.map(w => w.country))).sort();
    const allRegions = Array.from(new Set(mockWines.map(w => w.region))).sort();

    const filteredWines = useMemo(() => {
        return mockWines.filter(wine => {
            const matchesSearch =
                wine.name.toLowerCase().includes(search.toLowerCase()) ||
                wine.producer.toLowerCase().includes(search.toLowerCase()) ||
                wine.region.toLowerCase().includes(search.toLowerCase());

            const matchesType = selectedTypes.length === 0 || selectedTypes.includes(wine.type);
            const matchesCountry = selectedCountries.length === 0 || selectedCountries.includes(wine.country);
            const matchesRegion = selectedRegions.length === 0 || selectedRegions.includes(wine.region);
            const matchesStock = wine.stockUnopened >= stockRange[0] && wine.stockUnopened <= stockRange[1];

            return matchesSearch && matchesType && matchesCountry && matchesRegion && matchesStock;
        });
    }, [search, selectedTypes, selectedCountries, selectedRegions, stockRange]);

    const sortedWines = useMemo(() => {
        return [...filteredWines].sort((a, b) => {
            switch (sortBy) {
                case 'name-asc': return a.name.localeCompare(b.name);
                case 'name-desc': return b.name.localeCompare(a.name);
                case 'price-asc': return a.price - b.price;
                case 'price-desc': return b.price - a.price;
                case 'stock-asc': return a.stockUnopened - b.stockUnopened;
                case 'stock-desc': return b.stockUnopened - a.stockUnopened;
                default: return 0;
            }
        });
    }, [filteredWines, sortBy]);

    const activeFiltersCount = selectedTypes.length + selectedCountries.length + selectedRegions.length + (stockRange[0] > 0 || stockRange[1] < 100 ? 1 : 0);

    const clearFilters = () => {
        setSelectedTypes([]);
        setSelectedCountries([]);
        setSelectedRegions([]);
        setStockRange([0, 100]);
        setSearch('');
    };

    const tableColumns: DataTableColumn<Wine>[] = [
        {
            key: 'wine',
            label: 'Wine',
            minWidth: 280,
            render: (w) => (
                <div className="flex items-center gap-3">
                    {w.hasImage ? (
                        <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                            {/* Placeholder image logic */}
                            <WineIcon className="w-4 h-4 text-primary" />
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center shrink-0">
                            <ImageOff className="w-4 h-4 text-muted-foreground/50" />
                        </div>
                    )}
                    <div className="min-w-0">
                        <span className="font-medium text-foreground block truncate">{w.name}</span>
                        <span className="text-xs text-muted-foreground block truncate">{w.producer}</span>
                    </div>
                </div>
            ),
            sortFn: (a, b) => a.name.localeCompare(b.name)
        },
        { key: 'vintage', label: 'Vintage', minWidth: 80, align: 'center', render: w => w.vintage || 'NV', sortFn: (a, b) => (a.vintage || 0) - (b.vintage || 0) },
        { key: 'type', label: 'Type', minWidth: 100, render: w => w.type },
        { key: 'country', label: 'Country', minWidth: 120, render: w => w.country },
        { key: 'region', label: 'Region', minWidth: 140, render: w => w.region },
        {
            key: 'stock',
            label: 'Stock',
            minWidth: 100,
            align: 'right',
            render: w => (
                <span className={w.stockUnopened < w.minStockLevel ? 'text-destructive font-medium' : ''}>
                    {w.stockUnopened} btls
                </span>
            ),
            sortFn: (a, b) => a.stockUnopened - b.stockUnopened
        },
        {
            key: 'price',
            label: 'Price',
            minWidth: 100,
            align: 'right',
            render: w => `$${w.price.toFixed(2)}`,
            sortFn: (a, b) => a.price - b.price
        },
        {
            key: 'status',
            label: 'Status',
            minWidth: 110,
            align: 'center',
            render: w => {
                const statusColors = {
                    in_stock: 'bg-wine-success/10 text-wine-success border-wine-success/20',
                    low_stock: 'bg-wine-warning/10 text-wine-warning border-wine-warning/20',
                    out_of_stock: 'bg-destructive/10 text-destructive border-destructive/20'
                };
                const labels = { in_stock: 'In Stock', low_stock: 'Low Stock', out_of_stock: 'Out of Stock' };
                const s = w.stockStatus || 'in_stock';
                return (
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${statusColors[s]}`}>
                        {labels[s]}
                    </span>
                );
            }
        }
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] animate-fade-in space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-heading font-bold">Wine Catalog</h1>
                    <p className="text-muted-foreground mt-1">Manage your complete wine inventory</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="border-border hidden sm:flex">
                        <FileUp className="w-4 h-4 mr-2" /> Import
                    </Button>
                    <Button className="wine-gradient text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]" onClick={() => navigate('/catalog/new')}>
                        <Plus className="w-4 h-4 mr-2" /> Add Wine
                    </Button>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col gap-3 shrink-0">
                <div className="flex gap-2">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search wines, producers, regions..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 h-11 bg-card border-border shadow-sm"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-secondary transition-colors">
                                <X className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                        )}
                    </div>

                    <div className="hidden md:flex gap-2">
                        <FilterManager
                            filters={[
                                { key: 'type', label: 'Wine Type' },
                                { key: 'country', label: 'Country' },
                                { key: 'region', label: 'Region' },
                                { key: 'stock', label: 'Stock Level' },
                                { key: 'sort', label: 'Sort Order' },
                            ]}
                            visibleFilters={catalogFilters}
                            onChange={setCatalogFilters}
                        />
                        {viewMode === 'table' && (
                            <ColumnManager
                                columns={tableColumns}
                                visibleColumns={catalogColumns}
                                onChange={setCatalogColumns}
                            />
                        )}
                    </div>

                    <div className="flex items-center bg-card border border-border rounded-lg p-1 ml-auto">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-secondary text-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary/50'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-secondary text-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary/50'}`}
                        >
                            <Table2 className="w-4 h-4" />
                        </button>
                    </div>

                    <Button
                        variant={showFilters ? 'secondary' : 'outline'}
                        size="icon"
                        className="md:hidden border-border"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                    </Button>
                </div>

                {/* Filters Row (Desktop) */}
                <div className="hidden md:flex items-center gap-2 flex-wrap">
                    {catalogFilters.includes('type') && (
                        <MultiSelectFilter label="Type" options={allTypes} selected={selectedTypes} onChange={setSelectedTypes} />
                    )}
                    {catalogFilters.includes('country') && (
                        <MultiSelectFilter label="Country" options={allCountries} selected={selectedCountries} onChange={setSelectedCountries} />
                    )}
                    {catalogFilters.includes('region') && (
                        <MultiSelectFilter label="Region" options={allRegions} selected={selectedRegions} onChange={setSelectedRegions} className="w-40" />
                    )}

                    {catalogFilters.includes('stock') && (
                        <div className="flex items-center gap-2 px-3 h-9 rounded-md border border-border bg-card">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">Stock: {stockRange[0]}-{stockRange[1]}+</span>
                            <Slider
                                value={stockRange}
                                min={0}
                                max={100}
                                step={5}
                                onValueChange={(v) => setStockRange(v as [number, number])}
                                className="w-24"
                            />
                        </div>
                    )}

                    {catalogFilters.includes('sort') && (
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="h-9 w-[160px] bg-card border-border text-xs">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                                <SelectItem value="price-asc">Price (Low-High)</SelectItem>
                                <SelectItem value="price-desc">Price (High-Low)</SelectItem>
                                <SelectItem value="stock-asc">Stock (Low-High)</SelectItem>
                                <SelectItem value="stock-desc">Stock (High-Low)</SelectItem>
                            </SelectContent>
                        </Select>
                    )}

                    {activeFiltersCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-xs text-muted-foreground hover:text-foreground">
                            Clear filters
                        </Button>
                    )}
                </div>

                {/* Mobile Filters */}
                {showFilters && (
                    <div className="md:hidden bg-secondary/30 border border-border rounded-lg p-4 grid gap-4 mb-2 animate-in slide-in-from-top-2">
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-muted-foreground">Type</span>
                            <div className="flex flex-wrap gap-1.5">
                                {allTypes.map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setSelectedTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                                        className={`px-2.5 py-1 rounded-full text-xs border ${selectedTypes.includes(t) ? 'bg-primary/20 border-primary/30 text-primary' : 'bg-card border-border text-muted-foreground'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {/* Simplified mobile filters for brevity */}
                        <Button size="sm" variant="outline" onClick={clearFilters} className="w-full">Reset Filters</Button>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
                {viewMode === 'table' ? (
                    <DataTable
                        data={sortedWines}
                        columns={tableColumns}
                        visibleColumns={catalogColumns}
                        columnWidths={columnWidths}
                        onColumnResize={setColumnWidth}
                        onRowClick={(w) => navigate(`/catalog/${w.id}`)}
                        keyExtractor={w => w.id}
                        emptyMessage="No wines found matching your criteria."
                        rowClassName={(w) => w.stockStatus === 'out_of_stock' ? 'opacity-60 bg-muted/20' : ''}
                    />
                ) : (
                    <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
                        {sortedWines.map(wine => (
                            <div
                                key={wine.id}
                                onClick={() => navigate(`/catalog/${wine.id}`)}
                                className="group relative bg-card hover:bg-secondary/20 border border-border hover:border-accent/30 rounded-xl overflow-hidden transition-all cursor-pointer flex flex-col"
                            >
                                <div className="aspect-[4/3] bg-secondary/50 relative overflow-hidden">
                                    {wine.hasImage ? (
                                        <div className="w-full h-full flex items-center justify-center bg-muted/20">
                                            <WineIcon className="w-12 h-12 text-muted-foreground/20" />
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                                            <ImageOff className="w-10 h-10" />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm bg-card/90 backdrop-blur-sm border border-border`}>
                                            ${wine.price}
                                        </span>
                                    </div>
                                    {wine.stockStatus === 'low_stock' && (
                                        <div className="absolute bottom-0 left-0 right-0 bg-wine-warning/90 text-wine-warning-foreground text-[10px] font-bold text-center py-0.5 backdrop-blur-sm">
                                            LOW STOCK
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 flex-1 flex flex-col">
                                    <h3 className="font-heading font-semibold text-base leading-tight mb-0.5 line-clamp-1 group-hover:text-primary transition-colors">{wine.name}</h3>
                                    <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{wine.producer}</p>

                                    <div className="mt-auto flex items-center justify-between text-xs">
                                        <span className="bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{wine.vintage || 'NV'}</span>
                                        <span className={wine.stockUnopened < wine.minStockLevel ? 'text-destructive font-bold' : 'text-muted-foreground'}>
                                            {wine.stockUnopened} in stock
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {sortedWines.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <Search className="w-12 h-12 opacity-20 mb-4" />
                                <p>No wines found</p>
                                <Button variant="link" onClick={clearFilters}>Clear filters</Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="text-xs text-muted-foreground text-center shrink-0 pb-2">
                Showing {sortedWines.length} of {mockWines.length} wines
            </div>
        </div>
    );
}
