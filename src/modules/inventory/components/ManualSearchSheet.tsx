import { useState, useMemo } from 'react';
import { Search, ChevronRight, ImageOff, Wine as WineIcon } from 'lucide-react';
import { Input } from '@/core/ui/input';
import { Button } from '@/core/ui/button';
import {
    Sheet, SheetContent, SheetHeader, SheetTitle
} from '@/core/ui/sheet';
import { mockWines, Wine } from '@/core/lib/mockData';

interface ManualSearchSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (wine: Wine) => void;
}

export default function ManualSearchSheet({ open, onOpenChange, onSelect }: ManualSearchSheetProps) {
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        if (!query) return [];
        const q = query.toLowerCase();
        return mockWines.filter(w =>
            w.name.toLowerCase().includes(q) ||
            w.producer.toLowerCase().includes(q)
        ).slice(0, 10); // limit results
    }, [query]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl px-0 pb-0">
                <SheetHeader className="px-6 mb-4">
                    <SheetTitle className="text-left">Search Catalog</SheetTitle>
                </SheetHeader>

                <div className="px-6 mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Type wine name or producer..."
                            className="pl-9 bg-secondary/30"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="overflow-y-auto h-full pb-20 px-4">
                    {query && filtered.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground">
                            <p>No wines found.</p>
                            <Button variant="link" className="mt-2">Add New Wine</Button>
                        </div>
                    )}

                    <div className="space-y-2">
                        {filtered.map(wine => (
                            <button
                                key={wine.id}
                                onClick={() => onSelect(wine)}
                                className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/40 transition-colors text-left group"
                            >
                                <div className="w-12 h-16 bg-secondary/50 rounded-md shrink-0 flex items-center justify-center overflow-hidden">
                                    {wine.hasImage ? (
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <WineIcon className="w-4 h-4 text-primary" />
                                        </div>
                                    ) : (
                                        <ImageOff className="w-5 h-5 text-muted-foreground/30" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold truncate">{wine.name}</h4>
                                    <p className="text-sm text-muted-foreground truncate">{wine.producer}</p>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                        <span className="bg-secondary px-1.5 py-0.5 rounded">{wine.vintage || 'NV'}</span>
                                        <span>{wine.region} · {wine.type}</span>
                                    </div>
                                </div>

                                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </button>
                        ))}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
