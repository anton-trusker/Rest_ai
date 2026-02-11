import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockWines, Wine } from '@/core/lib/mockData';
import { useAuthStore } from '@/core/auth/authStore';
import { useColumnStore } from '@/core/settings/columnStore';
import { useIsMobile } from '@/layout/hooks/useIsMobile';
import {
    Search, SlidersHorizontal, ArrowUpDown, Download,
    RefreshCw, LayoutGrid, Table2, Wine as WineIcon
} from 'lucide-react';
import { Input } from '@/core/ui/input';
import { Button } from '@/core/ui/button';
import { Slider } from '@/core/ui/slider';
import FilterManager from '@/core/ui/FilterManager';
import ColumnManager from '@/core/ui/ColumnManager';
import MultiSelectFilter from '@/core/ui/MultiSelectFilter';
import DataTable, { DataTableColumn } from '@/core/ui/DataTable';

export default function CurrentStock() {
    const navigate = useNavigate();
    const { isMobile } = useIsMobile();
    const { stockColumns, stockFilters, setColumnWidth, columnWidths, setStockColumns, setStockFilters } = useColumnStore();

    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [showFilters, setShowFilters] = useState(false);

    // Filters
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
    const [stockRange, setStockRange] = useState<[number, number]>([0, 100]);

    const allTypes = Array.from(new Set(mockWines.map(w => w.type))).sort();
    const allLocations = Array.from(new Set(mockWines.map(w => w.location))).sort();

    const filteredData = useMemo(() => {
        return mockWines.filter(w => {
            const matchesSearch = w.name.toLowerCase().includes(search.toLowerCase()) ||
                w.producer.toLowerCase().includes(search.toLowerCase());
            const matchesType = selectedTypes.length === 0 || selectedTypes.includes(w.type);
            const matchesLocation = selectedLocations.length === 0 || selectedLocations.includes(w.location);
            const matchesStock = w.stockUnopened >= stockRange[0] && w.stockUnopened <= stockRange[1];

            return matchesSearch && matchesType && matchesLocation && matchesStock;
        });
    }, [search, selectedTypes, selectedLocations, stockRange]);

    const tableColumns: DataTableColumn<Wine>[] = [
        {
            key: 'wine', label: 'Wine', minWidth: 250,
            render: (w) => (
                <div>
                    <span className="font-medium block truncate">{w.name}</span>
                    <span className="text-xs text-muted-foreground block truncate">{w.producer}</span>
                </div>
            ),
            sortFn: (a, b) => a.name.localeCompare(b.name)
        },
        { key: 'vintage', label: 'Vintage', minWidth: 80, align: 'center', render: w => w.vintage || 'NV' },
        { key: 'type', label: 'Type', minWidth: 100, render: w => w.type },
        { key: 'size', label: 'Size', minWidth: 80, render: w => `${w.volume}ml` },
        { key: 'region', label: 'Region', minWidth: 120, render: w => w.region },
        { key: 'location', label: 'Location', minWidth: 120, render: w => w.location },
        {
            key: 'closed', label: 'Unopened', minWidth: 100, align: 'right',
            render: w => <span className="font-mono">{w.stockUnopened}</span>,
            sortFn: (a, b) => a.stockUnopened - b.stockUnopened
        },
        {
            key: 'open', label: 'Opened', minWidth: 80, align: 'right',
            render: w => <span className="font-mono text-muted-foreground">{w.stockOpened}</span>
        },
        {
            key: 'status', label: 'Status', minWidth: 110, align: 'center',
            render: w => {
                const c = w.stockStatus === 'low_stock' ? 'text-wine-warning bg-wine-warning/10' :
                    w.stockStatus === 'out_of_stock' ? 'text-destructive bg-destructive/10' :
                        'text-wine-success bg-wine-success/10';
                return <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${c}`}>{w.stockStatus?.replace('_', ' ')}</span>
            }
        },
        {
            key: 'value', label: 'Value', minWidth: 100, align: 'right',
            render: w => `$${(w.price * w.stockUnopened).toFixed(0)}`,
            sortFn: (a, b) => (a.price * a.stockUnopened) - (b.price * b.stockUnopened)
        }
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] space-y-4 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-heading font-bold">Current Stock</h1>
                    <p className="text-muted-foreground mt-1">Real-time inventory levels</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="border-border">
                        <Download className="w-4 h-4 mr-2" /> Export
                    </Button>
                    <Button className="wine-gradient text-primary-foreground" onClick={() => navigate('/inventory/count')}>
                        <RefreshCw className="w-4 h-4 mr-2" /> Start Count
                    </Button>
                </div>
            </div>

            {/* Tools */}
            <div className="flex flex-col gap-3 shrink-0">
                <div className="flex gap-2">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search stock..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            className="pl-9 bg-card border-border"
                        />
                    </div>

                    <div className="hidden md:flex gap-2">
                        <FilterManager
                            filters={[
                                { key: 'type', label: 'Type' },
                                { key: 'location', label: 'Location' },
                                { key: 'stockRange', label: 'Stock Level' },
                            ]}
                            visibleFilters={stockFilters}
                            onChange={setStockFilters}
                        />
                        {viewMode === 'table' && (
                            <ColumnManager columns={tableColumns} visibleColumns={stockColumns} onChange={setStockColumns} />
                        )}
                    </div>

                    <Button size="icon" variant="outline" className="md:hidden" onClick={() => setShowFilters(!showFilters)}>
                        <SlidersHorizontal className="w-4 h-4" />
                    </Button>
                </div>

                {/* Active Filters */}
                <div className="hidden md:flex flex-wrap gap-2 items-center">
                    {stockFilters.includes('type') && (
                        <MultiSelectFilter label="Type" options={allTypes} selected={selectedTypes} onChange={setSelectedTypes} />
                    )}
                    {stockFilters.includes('location') && (
                        <MultiSelectFilter label="Location" options={allLocations} selected={selectedLocations} onChange={setSelectedLocations} />
                    )}
                    {stockFilters.includes('stockRange') && (
                        <div className="flex items-center gap-2 px-3 h-9 rounded-md border border-border bg-card">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">Stock: {stockRange[0]}-{stockRange[1]}+</span>
                            <Slider value={stockRange} min={0} max={100} step={5} onValueChange={(v) => setStockRange(v as [number, number])} className="w-24" />
                        </div>
                    )}
                </div>
            </div>

            {/* Data */}
            <div className="flex-1 bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
                <DataTable
                    data={filteredData}
                    columns={tableColumns}
                    visibleColumns={stockColumns}
                    columnWidths={columnWidths}
                    onColumnResize={setColumnWidth}
                    onRowClick={(w) => navigate(`/catalog/${w.id}`)}
                    keyExtractor={w => w.id}
                />
            </div>
        </div>
    );
}
