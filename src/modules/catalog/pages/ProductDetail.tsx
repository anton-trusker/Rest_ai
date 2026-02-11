import { useNavigate, useParams } from 'react-router-dom';
import { mockWines } from '@/core/lib/mockData';
import { useAuthStore } from '@/core/auth/authStore';
import {
    ArrowLeft, Edit, Trash2, MapPin, Tag, Calendar,
    Droplets, DollarSign, BarChart3, Clock, Grape, FileText,
    Wine as WineIcon, ImageOff
} from 'lucide-react';
import { Button } from '@/core/ui/button';
import { toast } from 'sonner';

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const wine = mockWines.find(w => w.id === id);

    if (!wine) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <h2 className="text-2xl font-bold mb-2">Wine Not Found</h2>
                <Button variant="outline" onClick={() => navigate('/catalog')}>Return to Catalog</Button>
            </div>
        );
    }

    const handleDelete = () => {
        toast.error('Delete functionality restricted in demo');
    };

    return (
        <div className="max-w-5xl mx-auto pb-10 animate-fade-in">
            {/* Header */}
            <div className="mb-6 flex items-start justify-between">
                <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-primary" onClick={() => navigate('/catalog')}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Catalog
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10" onClick={handleDelete}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </Button>
                    <Button className="wine-gradient text-primary-foreground" onClick={() => navigate(`/catalog/${id}/edit`)}>
                        <Edit className="w-4 h-4 mr-2" /> Edit Wine
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8">
                {/* Left Column: Image & Quick Stats */}
                <div className="space-y-6">
                    <div className="aspect-[3/4] rounded-2xl bg-secondary/30 border border-border flex items-center justify-center overflow-hidden shadow-sm relative group">
                        {wine.hasImage ? (
                            <div className="w-full h-full flex items-center justify-center bg-muted/20">
                                <WineIcon className="w-24 h-24 text-muted-foreground/20" />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-muted-foreground/40">
                                <ImageOff className="w-16 h-16 mb-2" />
                                <span className="text-sm">No Image</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button variant="secondary" size="sm">Change Image</Button>
                        </div>
                    </div>

                    <div className="wine-glass-effect rounded-xl p-5 space-y-4">
                        <h3 className="font-heading font-semibold text-lg border-b border-border/50 pb-2">Stock Summary</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-secondary/50 rounded-lg p-3 text-center">
                                <span className="text-2xl font-bold block">{wine.stockUnopened}</span>
                                <span className="text-xs text-muted-foreground uppercase tracking-wide">Unopened</span>
                            </div>
                            <div className="bg-secondary/50 rounded-lg p-3 text-center">
                                <span className="text-2xl font-bold block">{wine.stockOpened}</span>
                                <span className="text-xs text-muted-foreground uppercase tracking-wide">Opened</span>
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Min Level</span>
                                <span className="font-medium">{wine.minStockLevel}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Max Level</span>
                                <span className="font-medium">{wine.maxStockLevel || '-'}</span>
                            </div>
                            <div className="flex justify-between text-sm pt-2 border-t border-border/50">
                                <span className="text-muted-foreground">Status</span>
                                <span className={`font-bold capitalize ${wine.stockStatus === 'in_stock' ? 'text-wine-success' :
                                        wine.stockStatus === 'low_stock' ? 'text-wine-warning' : 'text-destructive'
                                    }`}>{wine.stockStatus?.replace('_', ' ')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Details */}
                <div className="space-y-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-wider">
                                {wine.type}
                            </span>
                            {wine.vintage && (
                                <span className="px-2.5 py-0.5 rounded-full bg-secondary border border-border text-xs font-medium">
                                    {wine.vintage}
                                </span>
                            )}
                        </div>
                        <h1 className="text-4xl font-heading font-bold mb-2">{wine.name}</h1>
                        <p className="text-xl text-muted-foreground font-light">{wine.producer}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            <div className="space-y-1">
                                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Origin</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 text-sm">
                                        <MapPin className="w-4 h-4 text-muted-foreground" />
                                        <span>{wine.region}, {wine.country}</span>
                                    </div>
                                    {wine.subRegion && <div className="pl-7 text-sm text-muted-foreground">{wine.subRegion}</div>}
                                    {wine.appellation && <div className="pl-7 text-sm text-muted-foreground italic">{wine.appellation}</div>}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Details</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 text-sm">
                                        <Grape className="w-4 h-4 text-muted-foreground" />
                                        <span>{wine.grapeVarieties.join(', ')}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Droplets className="w-4 h-4 text-muted-foreground" />
                                        <span>{wine.volume}ml · {wine.abv}% ABV</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Tag className="w-4 h-4 text-muted-foreground" />
                                        <span>SKU: {wine.sku}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-1">
                                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Pricing</h3>
                                <div className="space-y-2 bg-secondary/20 p-4 rounded-xl border border-border">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Purchase Price</span>
                                        <span className="font-mono">{wine.purchasePrice ? `$${wine.purchasePrice.toFixed(2)}` : '-'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-lg font-semibold">
                                        <span className="text-sm font-normal text-muted-foreground">Sale Price</span>
                                        <span className="font-mono text-primary">${wine.price.toFixed(2)}</span>
                                    </div>
                                    {wine.glassPrice && (
                                        <div className="flex justify-between items-center pt-2 border-t border-border/50">
                                            <span className="text-sm text-muted-foreground">Glass Price</span>
                                            <span className="font-mono">${wine.glassPrice.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Location</h3>
                                <div className="flex items-center gap-3 text-sm p-3 bg-secondary/30 rounded-lg border border-border">
                                    <MapPin className="w-4 h-4 text-accent" />
                                    <div>
                                        <span className="font-medium block">{wine.location}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {wine.cellarSection} · Rack {wine.rackNumber}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-border pt-6">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Tasting Notes</h3>
                        <p className="text-sm leading-relaxed text-foreground/80 italic">
                            "{wine.tastingNotes || 'No tasting notes available.'}"
                        </p>
                        <div className="flex gap-4 mt-4">
                            {['Body', 'Sweetness', 'Acidity', 'Tannins'].map(trait => {
                                const key = trait.toLowerCase() as keyof typeof wine;
                                const val = wine[key];
                                if (!val || typeof val !== 'string') return null;
                                return (
                                    <div key={trait} className="bg-secondary/40 px-3 py-1.5 rounded-md border border-border">
                                        <span className="block text-[10px] text-muted-foreground uppercase">{trait}</span>
                                        <span className="text-xs font-medium capitalize">{val}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
