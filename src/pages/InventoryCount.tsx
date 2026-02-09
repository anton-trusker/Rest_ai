import { useState } from 'react';
import { Search, Scan, Camera, Play, Pause, StopCircle, Plus, Minus, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockWines, Wine } from '@/data/mockWines';
import { toast } from 'sonner';

type Phase = 'setup' | 'mode-select' | 'manual-search' | 'barcode' | 'image' | 'quantity';

export default function InventoryCount() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [countType, setCountType] = useState('full');
  const [sessionId] = useState(() => `S${String(Math.floor(Math.random() * 9000) + 1000)}`);
  const [elapsed, setElapsed] = useState(0);
  const [counted, setCounted] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null);
  const [unopened, setUnopened] = useState(0);
  const [opened, setOpened] = useState(0);
  const [notes, setNotes] = useState('');

  const searchResults = searchQuery.length >= 2
    ? mockWines.filter(w => {
        const q = searchQuery.toLowerCase();
        return w.name.toLowerCase().includes(q) || w.producer.toLowerCase().includes(q);
      })
    : [];

  const handleSelectWine = (wine: Wine) => {
    setSelectedWine(wine);
    setUnopened(0);
    setOpened(0);
    setNotes('');
    setPhase('quantity');
  };

  const handleSubmitCount = () => {
    if (!selectedWine) return;
    toast.success(`Counted ${unopened + opened} bottles of ${selectedWine.name}`);
    setCounted(c => c + 1);
    setSelectedWine(null);
    setPhase('mode-select');
  };

  // Setup Phase
  if (phase === 'setup') {
    return (
      <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-heading font-bold">Start Inventory Count</h1>
          <p className="text-muted-foreground mt-1">Set up a new counting session</p>
        </div>

        <div className="wine-glass-effect rounded-xl p-6 space-y-5">
          <div className="space-y-2">
            <Label>Count Type</Label>
            <Select value={countType} onValueChange={setCountType}>
              <SelectTrigger className="h-12 bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Inventory</SelectItem>
                <SelectItem value="partial">Partial Count</SelectItem>
                <SelectItem value="spot">Spot Check</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea placeholder="e.g., Weekly count" className="bg-card border-border" />
          </div>

          <Button
            onClick={() => setPhase('mode-select')}
            className="w-full h-14 text-lg font-semibold wine-gradient text-primary-foreground hover:opacity-90"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Counting
          </Button>
        </div>
      </div>
    );
  }

  // Mode Selection
  if (phase === 'mode-select') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold">Session #{sessionId}</h1>
            <p className="text-muted-foreground mt-1">{counted} wines counted</p>
          </div>
          <Button
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive/10"
            onClick={() => { setPhase('setup'); toast.info('Session ended'); }}
          >
            <StopCircle className="w-4 h-4 mr-2" />
            End Session
          </Button>
        </div>

        <p className="text-muted-foreground">Choose how to identify the wine:</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button onClick={() => setPhase('manual-search')} className="mode-card text-center">
            <Search className="w-10 h-10 mx-auto mb-3 text-accent" />
            <h3 className="font-heading text-lg font-semibold mb-1">Manual Search</h3>
            <p className="text-sm text-muted-foreground">Search by name</p>
            <p className="text-xs text-muted-foreground mt-2">~30 sec per wine</p>
          </button>

          <button onClick={() => { setPhase('barcode'); toast.info('Camera access needed for barcode scanning. This is a demo preview.'); }} className="mode-card text-center">
            <Scan className="w-10 h-10 mx-auto mb-3 text-primary" />
            <h3 className="font-heading text-lg font-semibold mb-1">Barcode Scanner</h3>
            <p className="text-sm text-muted-foreground">Scan UPC/EAN</p>
            <p className="text-xs text-muted-foreground mt-2">~5 sec per wine</p>
          </button>

          <button onClick={() => { setPhase('image'); toast.info('AI recognition requires backend setup. This is a demo preview.'); }} className="mode-card text-center">
            <Camera className="w-10 h-10 mx-auto mb-3 text-wine-gold" />
            <h3 className="font-heading text-lg font-semibold mb-1">Image Recognition</h3>
            <p className="text-sm text-muted-foreground">Photo the label</p>
            <p className="text-xs text-muted-foreground mt-2">~10 sec per wine</p>
          </button>
        </div>
      </div>
    );
  }

  // Manual Search
  if (phase === 'manual-search') {
    return (
      <div className="max-w-lg mx-auto space-y-4 animate-fade-in">
        <button onClick={() => setPhase('mode-select')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to modes
        </button>

        <h2 className="font-heading text-xl font-semibold">Search Wine</h2>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Type wine name or producer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-card border-border"
            autoFocus
          />
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {searchResults.map(wine => (
            <button
              key={wine.id}
              onClick={() => handleSelectWine(wine)}
              className="w-full wine-glass-effect rounded-lg p-4 text-left hover:border-wine-gold/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{wine.name}</p>
                  <p className="text-sm text-muted-foreground">{wine.producer}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {wine.vintage || 'NV'} • {wine.volume}ml • {wine.region}
                  </p>
                </div>
                <Plus className="w-5 h-5 text-accent" />
              </div>
            </button>
          ))}
          {searchQuery.length >= 2 && searchResults.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No wines found</p>
          )}
        </div>
      </div>
    );
  }

  // Barcode / Image demo screens
  if (phase === 'barcode' || phase === 'image') {
    return (
      <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
        <button onClick={() => setPhase('mode-select')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to modes
        </button>

        <div className="wine-glass-effect rounded-2xl aspect-[3/4] flex flex-col items-center justify-center text-center p-8">
          {phase === 'barcode' ? (
            <>
              <Scan className="w-16 h-16 text-primary mb-4 animate-pulse" />
              <h2 className="font-heading text-xl font-semibold mb-2">Barcode Scanner</h2>
              <p className="text-muted-foreground mb-6">Point camera at the barcode on the bottle</p>
            </>
          ) : (
            <>
              <Camera className="w-16 h-16 text-wine-gold mb-4 animate-pulse" />
              <h2 className="font-heading text-xl font-semibold mb-2">Image Recognition</h2>
              <p className="text-muted-foreground mb-6">Take a photo of the wine label</p>
            </>
          )}
          <p className="text-xs text-muted-foreground mb-4">Camera features require backend integration (Lovable Cloud)</p>
          <Button variant="outline" onClick={() => {
            handleSelectWine(mockWines[Math.floor(Math.random() * mockWines.length)]);
          }}>
            Simulate Detection
          </Button>
        </div>
      </div>
    );
  }

  // Quantity Entry
  if (phase === 'quantity' && selectedWine) {
    return (
      <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
        <button onClick={() => setPhase('mode-select')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="wine-glass-effect rounded-xl p-6">
          <h2 className="font-heading text-xl font-semibold">{selectedWine.name}</h2>
          <p className="text-sm text-muted-foreground">{selectedWine.producer}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedWine.vintage || 'NV'} • {selectedWine.volume}ml • {selectedWine.region}
          </p>
        </div>

        <div className="space-y-6">
          {/* Unopened */}
          <div className="wine-glass-effect rounded-xl p-6">
            <Label className="text-base font-medium mb-4 block">Unopened Bottles (Closed)</Label>
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => setUnopened(Math.max(0, unopened - 1))}
                className="w-14 h-14 rounded-full border-2 border-border flex items-center justify-center hover:border-accent transition-colors"
              >
                <Minus className="w-6 h-6" />
              </button>
              <span className="text-5xl font-heading font-bold w-20 text-center">{unopened}</span>
              <button
                onClick={() => setUnopened(unopened + 1)}
                className="w-14 h-14 rounded-full border-2 border-border flex items-center justify-center hover:border-accent transition-colors"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Opened */}
          <div className="wine-glass-effect rounded-xl p-6">
            <Label className="text-base font-medium mb-4 block">Opened Bottles (Partial)</Label>
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => setOpened(Math.max(0, opened - 1))}
                className="w-14 h-14 rounded-full border-2 border-border flex items-center justify-center hover:border-accent transition-colors"
              >
                <Minus className="w-6 h-6" />
              </button>
              <span className="text-5xl font-heading font-bold w-20 text-center">{opened}</span>
              <button
                onClick={() => setOpened(opened + 1)}
                className="w-14 h-14 rounded-full border-2 border-border flex items-center justify-center hover:border-accent transition-colors"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="e.g., Damaged label, low fill..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-card border-border"
            />
          </div>

          <Button
            onClick={handleSubmitCount}
            disabled={unopened + opened === 0}
            className="w-full h-14 text-lg font-semibold wine-gradient text-primary-foreground hover:opacity-90"
          >
            <Check className="w-5 h-5 mr-2" />
            Confirm Count ({unopened + opened} bottles)
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
