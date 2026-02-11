import { useState, useEffect } from 'react';
import { Wine } from '@/core/lib/mockData';
import { useSettingsStore } from '@/core/settings/settingsStore';
import {
    X, Minus, Plus, Save, MapPin, AlertCircle, Wine as WineIcon, ImageOff
} from 'lucide-react';
import { Button } from '@/core/ui/button';
import { Input } from '@/core/ui/input';
import { Textarea } from '@/core/ui/textarea';
import { Label } from '@/core/ui/label';
import {
    Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerClose
} from '@/core/ui/drawer';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/core/ui/select';

interface QuantityPopupProps {
    wine: Wine | null;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (unopened: number, opened: number, notes?: string, location?: string) => void;
    defaultLocation?: string;
}

export default function QuantityPopup({
    wine,
    isOpen,
    onClose,
    onConfirm,
    defaultLocation
}: QuantityPopupProps) {
    const { locations } = useSettingsStore();

    const [unopened, setUnopened] = useState(1);
    const [opened, setOpened] = useState(0);
    const [location, setLocation] = useState(defaultLocation || '');
    const [notes, setNotes] = useState('');

    // Reset when wine/open state changes
    useEffect(() => {
        if (wine) {
            setUnopened(1);
            setOpened(0);
            setLocation(wine.location || defaultLocation || '');
            setNotes('');
        }
    }, [wine, defaultLocation, isOpen]);

    const handleConfirm = () => {
        onConfirm(unopened, opened, notes, location);
        onClose();
    };

    if (!wine) return null;

    return (
        <Drawer open={isOpen} onOpenChange={(o) => !o && onClose()}>
            <DrawerContent className="max-h-[96vh] sm:max-h-[90vh]">
                <div className="mx-auto w-full max-w-sm">

                    <DrawerHeader className="relative border-b border-border/50 pb-4">
                        <div className="flex gap-4 items-start text-left">
                            <div className="w-16 h-20 bg-secondary/50 rounded-lg shrink-0 flex items-center justify-center overflow-hidden">
                                {wine.hasImage ? (
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <WineIcon className="w-5 h-5 text-primary" />
                                    </div>
                                ) : (
                                    <ImageOff className="w-8 h-8 text-muted-foreground/30" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-heading font-bold text-lg leading-tight mb-1">{wine.name}</h3>
                                <p className="text-sm text-muted-foreground truncate">{wine.producer}</p>
                                <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                                    <span className="bg-secondary px-1.5 py-0.5 rounded">{wine.vintage || 'NV'}</span>
                                    <span>{wine.type}</span>
                                </div>
                            </div>
                        </div>
                        <DrawerClose asChild>
                            <Button variant="ghost" size="icon" className="absolute top-2 right-2 rounded-full">
                                <X className="w-4 h-4" />
                            </Button>
                        </DrawerClose>
                    </DrawerHeader>

                    <div className="p-4 space-y-6 overflow-y-auto">
                        {/* Quantity Controls */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Unopened */}
                            <div className="space-y-3 p-4 bg-secondary/20 rounded-xl border border-border">
                                <Label className="text-center block text-sm font-medium text-muted-foreground">Unopened Bottles</Label>
                                <div className="flex items-center justify-between gap-2">
                                    <Button
                                        variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0"
                                        onClick={() => setUnopened(Math.max(0, unopened - 1))}
                                    >
                                        <Minus className="w-4 h-4" />
                                    </Button>
                                    <span className="text-2xl font-bold font-mono w-8 text-center">{unopened}</span>
                                    <Button
                                        variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0"
                                        onClick={() => setUnopened(unopened + 1)}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Opened */}
                            <div className="space-y-3 p-4 bg-secondary/20 rounded-xl border border-border">
                                <Label className="text-center block text-sm font-medium text-muted-foreground">Opened Bottles</Label>
                                <div className="flex items-center justify-between gap-2">
                                    <Button
                                        variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0"
                                        onClick={() => setOpened(Math.max(0, opened - 1))}
                                    >
                                        <Minus className="w-4 h-4" />
                                    </Button>
                                    <span className="text-2xl font-bold font-mono w-8 text-center">{opened}</span>
                                    <Button
                                        variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0"
                                        onClick={() => setOpened(opened + 1)}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-muted-foreground" /> Location
                            </Label>
                            <Select value={location} onValueChange={setLocation}>
                                <SelectTrigger className="w-full bg-secondary/30 border-border">
                                    <SelectValue placeholder="Confirm location" />
                                </SelectTrigger>
                                <SelectContent>
                                    {locations.map(l => (
                                        <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {location && location !== wine.location && (
                                <p className="text-xs text-amber-500 flex items-center gap-1 mt-1">
                                    <AlertCircle className="w-3 h-3" /> Location update suggested
                                </p>
                            )}
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label>Notes (Optional)</Label>
                            <Textarea
                                placeholder="Condition, damage, misplaced..."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="resize-none h-20 bg-secondary/30 border-border"
                            />
                        </div>
                    </div>

                    <DrawerFooter className="px-4 pb-6 pt-2">
                        <Button className="w-full h-12 text-lg font-semibold wine-gradient shadow-lg" onClick={handleConfirm}>
                            <Save className="w-5 h-5 mr-2" /> Confirm Count
                        </Button>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
