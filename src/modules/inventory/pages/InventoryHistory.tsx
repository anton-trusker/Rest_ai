import { useState, useMemo } from 'react';
import { mockMovements, InventoryMovement } from '@/core/lib/mockData';
import { useAuthStore } from '@/core/auth/authStore';
import { useColumnStore } from '@/core/settings/columnStore';
import { Search, Calendar, User, Truck, Download } from 'lucide-react';
import { Input } from '@/core/ui/input';
import { Button } from '@/core/ui/button';
import DataTable, { DataTableColumn } from '@/core/ui/DataTable';
import FilterManager from '@/core/ui/FilterManager';
import ColumnManager from '@/core/ui/ColumnManager';
import MultiSelectFilter from '@/core/ui/MultiSelectFilter';

export default function InventoryHistory() {
    const { historyColumns, historyFilters, setColumnWidth, columnWidths, setHistoryColumns, setHistoryFilters } = useColumnStore();
    const [search, setSearch] = useState('');
    const [selectedMethods, setSelectedMethods] = useState<string[]>([]);

    const filteredData = useMemo(() => {
        return mockMovements.filter(m => {
            const matchSearch = m.wineName.toLowerCase().includes(search.toLowerCase()) ||
                m.userName.toLowerCase().includes(search.toLowerCase());
            const matchMethod = selectedMethods.length === 0 || selectedMethods.includes(m.method);
            return matchSearch && matchMethod;
        }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [search, selectedMethods]);

    const columns: DataTableColumn<InventoryMovement>[] = [
        {
            key: 'timestamp', label: 'Time', minWidth: 160,
            render: m => <span className="text-sm">{new Date(m.timestamp).toLocaleString()}</span>
        },
        {
            key: 'user', label: 'User', minWidth: 140,
            render: m => (
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold">
                        {m.userName.charAt(0)}
                    </div>
                    <span>{m.userName}</span>
                </div>
            )
        },
        { key: 'wine', label: 'Wine', minWidth: 200, render: m => m.wineName },
        {
            key: 'method', label: 'Method', minWidth: 120,
            render: m => (
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${m.method === 'image_ai' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                        m.method === 'barcode' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                            'bg-secondary text-muted-foreground border-border'
                    }`}>
                    {m.method.replace('_', ' ')}
                </span>
            )
        },
        { key: 'closed', label: 'Unopened', minWidth: 100, align: 'right', render: m => m.unopened },
        { key: 'open', label: 'Opened', minWidth: 80, align: 'right', render: m => m.opened },
        {
            key: 'confidence', label: 'Conf.', minWidth: 80, align: 'right',
            render: m => m.confidence ? `${m.confidence.toFixed(0)}%` : '-'
        },
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] space-y-4 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-heading font-bold">History & Audit</h1>
                    <p className="text-muted-foreground mt-1">Track every stock movement</p>
                </div>
                <Button variant="outline" className="border-border">
                    <Download className="w-4 h-4 mr-2" /> Export Log
                </Button>
            </div>

            {/* Tools */}
            <div className="flex flex-col gap-3 shrink-0">
                <div className="flex gap-2">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search history..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            className="pl-9 bg-card border-border"
                        />
                    </div>

                    <div className="hidden md:flex gap-2">
                        <FilterManager
                            filters={[{ key: 'method', label: 'Entry Method' }]}
                            visibleFilters={historyFilters}
                            onChange={setHistoryFilters}
                        />
                        <ColumnManager columns={columns} visibleColumns={historyColumns} onChange={setHistoryColumns} />
                    </div>
                </div>

                {historyFilters.includes('method') && (
                    <div className="flex">
                        <MultiSelectFilter
                            label="Method"
                            options={['manual', 'barcode', 'image_ai']}
                            selected={selectedMethods}
                            onChange={setSelectedMethods}
                        />
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="flex-1 bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
                <DataTable
                    data={filteredData}
                    columns={columns}
                    visibleColumns={historyColumns}
                    columnWidths={columnWidths}
                    onColumnResize={setColumnWidth}
                    keyExtractor={m => m.id}
                />
            </div>
        </div>
    );
}
