import { useState, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockWines } from '@/core/lib/mockData';
import { useAuthStore } from '@/core/auth/authStore';
import { useSettingsStore } from '@/core/settings/settingsStore';
import { wineRegions, countries } from '@/core/lib/referenceData';
import {
    Save, ArrowLeft, Upload, Info, DollarSign,
    MapPin, Tag, Box, FileText, LayoutList
} from 'lucide-react';
import { Button } from '@/core/ui/button';
import { Input } from '@/core/ui/input';
import { Label } from '@/core/ui/label';
import { Textarea } from '@/core/ui/textarea';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/core/ui/select';
import { Checkbox } from '@/core/ui/checkbox';
import { toast } from 'sonner';
import CollapsibleSection from '@/core/ui/CollapsibleSection';

export default function ProductForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;
    const wineToEdit = isEdit ? mockWines.find(w => w.id === id) : null;
    const { locations } = useSettingsStore();

    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form State (simplified for demo)
    const [formData, setFormData] = useState({
        name: wineToEdit?.name || '',
        producer: wineToEdit?.producer || '',
        vintage: wineToEdit?.vintage?.toString() || '',
        type: wineToEdit?.type || 'Red',
        country: wineToEdit?.country || '',
        region: wineToEdit?.region || '',
        sku: wineToEdit?.sku || '',
        price: wineToEdit?.price?.toString() || '',
        stockUnopened: wineToEdit?.stockUnopened?.toString() || '0',
        minStockLevel: wineToEdit?.minStockLevel?.toString() || '6',
        location: wineToEdit?.location || '',
        tastingNotes: wineToEdit?.tastingNotes || '',
        hasImage: wineToEdit?.hasImage || false,
    });

    const handleChange = (field: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!formData.name || !formData.producer) {
            toast.error('Please fill in required fields');
            return;
        }

        setIsLoading(true);
        // Simulate API call
        await new Promise(r => setTimeout(r, 1000));

        toast.success(isEdit ? 'Wine updated successfully' : 'Wine created successfully');
        setIsLoading(false);
        navigate('/catalog');
    };

    const activeRegions = useMemo(() => {
        return wineRegions[formData.country as keyof typeof wineRegions] || [];
    }, [formData.country]);

    return (
        <div className="max-w-4xl mx-auto pb-12 animate-fade-in">
            <div className="flex items-center justify-between mb-6 sticky top-0 z-20 bg-background/95 backdrop-blur py-4 border-b border-border/50 -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/catalog')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="font-heading text-2xl font-bold">{isEdit ? 'Edit Wine' : 'Add New Wine'}</h1>
                        <p className="text-xs text-muted-foreground">{isEdit ? `Updating ${wineToEdit?.name}` : 'Create a new catalog entry'}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate('/catalog')}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isLoading} className="wine-gradient text-primary-foreground min-w-[100px]">
                        {isLoading ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save</>}
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                {/* Core Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <LayoutList className="w-4 h-4 text-primary" /> Basic Information
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label>Wine Name *</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={e => handleChange('name', e.target.value)}
                                        placeholder="e.g. Château Margaux"
                                        className="bg-secondary/30 font-medium"
                                    />
                                </div>
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label>Producer *</Label>
                                    <Input
                                        value={formData.producer}
                                        onChange={e => handleChange('producer', e.target.value)}
                                        placeholder="Winery or Estate name"
                                        className="bg-secondary/30"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Type</Label>
                                    <Select value={formData.type} onValueChange={v => handleChange('type', v)}>
                                        <SelectTrigger className="bg-secondary/30"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {['Red', 'White', 'Rosé', 'Sparkling', 'Fortified', 'Dessert'].map(t => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Vintage</Label>
                                    <Input
                                        type="number"
                                        value={formData.vintage}
                                        onChange={e => handleChange('vintage', e.target.value)}
                                        placeholder="YYYY"
                                        className="bg-secondary/30"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-primary" /> Origin & Location
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Country</Label>
                                    <Select value={formData.country} onValueChange={v => handleChange('country', v)}>
                                        <SelectTrigger className="bg-secondary/30"><SelectValue placeholder="Select Country" /></SelectTrigger>
                                        <SelectContent>
                                            {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Region</Label>
                                    <Select value={formData.region} onValueChange={v => handleChange('region', v)} disabled={!formData.country}>
                                        <SelectTrigger className="bg-secondary/30"><SelectValue placeholder="Select Region" /></SelectTrigger>
                                        <SelectContent>
                                            {activeRegions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                            <SelectItem value="Other">Other...</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5 sm:col-span-2 pt-2 border-t border-border/50 mt-2">
                                    <Label>Storage Location</Label>
                                    <Select value={formData.location} onValueChange={v => handleChange('location', v)}>
                                        <SelectTrigger className="bg-secondary/30"><SelectValue placeholder="Select Cellar Location" /></SelectTrigger>
                                        <SelectContent>
                                            {locations.map(l => (
                                                <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                            <div className="w-full aspect-[3/4] bg-secondary/30 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/50 transition-colors group relative overflow-hidden"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {formData.hasImage ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-sm font-medium text-primary">Image Selected</span>
                                        <Button size="sm" variant="outline">Replace</Button>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8 text-muted-foreground mb-2 group-hover:scale-110 transition-transform" />
                                        <span className="text-sm font-medium text-muted-foreground">Upload Label Image</span>
                                    </>
                                )}
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={() => handleChange('hasImage', true)} />
                            </div>
                        </div>

                        <div className="wine-glass-effect rounded-xl p-5 space-y-4">
                            <h3 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                                <Box className="w-4 h-4" /> Stock Control
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center bg-secondary/30 p-2 rounded-lg">
                                    <Label className="cursor-pointer">Current Stock</Label>
                                    <Input
                                        type="number"
                                        className="w-20 text-right h-8"
                                        value={formData.stockUnopened}
                                        onChange={e => handleChange('stockUnopened', e.target.value)}
                                    />
                                </div>
                                <div className="flex justify-between items-center bg-secondary/30 p-2 rounded-lg">
                                    <Label className="cursor-pointer">Min Level</Label>
                                    <Input
                                        type="number"
                                        className="w-20 text-right h-8"
                                        value={formData.minStockLevel}
                                        onChange={e => handleChange('minStockLevel', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Collapsible Details */}
                <CollapsibleSection icon={DollarSign} title="Pricing & SKU" defaultOpen>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>Sale Price ($)</Label>
                            <Input
                                type="number" step="0.01"
                                value={formData.price}
                                onChange={e => handleChange('price', e.target.value)}
                                className="bg-secondary/30"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>SKU Code</Label>
                            <Input
                                value={formData.sku}
                                onChange={e => handleChange('sku', e.target.value)}
                                className="bg-secondary/30"
                            />
                        </div>
                    </div>
                </CollapsibleSection>

                <CollapsibleSection icon={FileText} title="Tasting Notes & Tags">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Description</Label>
                            <Textarea
                                rows={4}
                                value={formData.tastingNotes}
                                onChange={e => handleChange('tastingNotes', e.target.value)}
                                placeholder="Flavor profile, food pairings, etc."
                                className="bg-secondary/30"
                            />
                        </div>
                    </div>
                </CollapsibleSection>

            </div>
        </div>
    );
}


