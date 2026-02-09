import { Plus, Minus, Check, X, Wine as WineIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Wine } from '@/data/mockWines';
import { useSettingsStore } from '@/stores/settingsStore';
import { useState, useEffect } from 'react';

interface QuantityPopupProps {
  wine: Wine;
  compact?: boolean;
  onConfirm: (unopened: number, opened: number, notes: string) => void;
  onCancel: () => void;
}

function BottleCounter({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex-1 text-center">
      <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</Label>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-9 h-9 rounded-full border-2 border-border flex items-center justify-center hover:border-accent transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="text-3xl font-heading font-bold w-12 text-center">{value}</span>
        <button
          onClick={() => onChange(value + 1)}
          className="w-9 h-9 rounded-full border-2 border-border flex items-center justify-center hover:border-accent transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function PartialBottleRow({
  index,
  value,
  maxLitres,
  glassDimensions,
  onChange,
}: {
  index: number;
  value: number;
  maxLitres: number;
  glassDimensions: { id: string; label: string; volumeLitres: number }[];
  onChange: (litres: number) => void;
}) {
  const btlFraction = maxLitres > 0 ? value / maxLitres : 0;

  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Bottle #{index + 1}</span>
        <span className="text-xs text-muted-foreground">
          {value > 0 ? `${value.toFixed(3)}L · ${btlFraction.toFixed(2)} btl` : 'not set'}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {glassDimensions.map((g) => (
          <button
            key={g.id}
            onClick={() => onChange(g.volumeLitres)}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors border ${
              Math.abs(value - g.volumeLitres) < 0.0001
                ? 'bg-accent text-accent-foreground border-accent'
                : 'bg-secondary hover:bg-accent/20 border-border'
            }`}
          >
            {g.label}
          </button>
        ))}
        <div className="flex items-center gap-1">
          <Input
            type="number"
            step="0.001"
            min="0"
            max={maxLitres}
            value={value || ''}
            onChange={(e) => {
              const v = parseFloat(e.target.value) || 0;
              onChange(Math.min(v, maxLitres));
            }}
            placeholder="L"
            className="w-20 h-8 text-xs bg-secondary border-border"
          />
          <span className="text-xs text-muted-foreground">L</span>
        </div>
      </div>
    </div>
  );
}

export default function QuantityPopup({ wine, compact, onConfirm, onCancel }: QuantityPopupProps) {
  const { glassDimensions } = useSettingsStore();
  const [unopened, setUnopened] = useState(0);
  const [openedCount, setOpenedCount] = useState(0);
  const [partialLitres, setPartialLitres] = useState<number[]>([]);
  const [notes, setNotes] = useState('');

  const wineVolumeLitres = wine.volume / 1000;

  // Sync partialLitres array length with openedCount
  useEffect(() => {
    setPartialLitres((prev) => {
      if (prev.length < openedCount) return [...prev, ...Array(openedCount - prev.length).fill(0)];
      if (prev.length > openedCount) return prev.slice(0, openedCount);
      return prev;
    });
  }, [openedCount]);

  const sumPartials = partialLitres.reduce((a, b) => a + b, 0);
  const totalLitres = unopened * wineVolumeLitres + sumPartials;
  const totalBtl = unopened + (wineVolumeLitres > 0 ? sumPartials / wineVolumeLitres : 0);

  const updatePartial = (index: number, litres: number) => {
    setPartialLitres((prev) => prev.map((v, i) => (i === index ? litres : v)));
  };

  const handleConfirm = () => {
    const totalOpenedFraction = wineVolumeLitres > 0 ? sumPartials / wineVolumeLitres : 0;
    onConfirm(unopened, parseFloat(totalOpenedFraction.toFixed(3)), notes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onCancel} />

      <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 bg-card border border-border rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-heading font-semibold truncate">{wine.name}</h3>
            <p className="text-sm text-muted-foreground truncate">{wine.producer}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {wine.vintage || 'NV'} · {wine.volume}ml ({wineVolumeLitres}L)
            </p>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-full hover:bg-muted transition-colors flex-shrink-0">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Counters row */}
          <div className="flex gap-4">
            <BottleCounter label="Unopened" value={unopened} onChange={setUnopened} />
            {!compact && <BottleCounter label="Opened" value={openedCount} onChange={setOpenedCount} />}
          </div>

          {/* Partial bottles */}
          {!compact && openedCount > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium block">Partial Bottles</Label>
              {partialLitres.map((val, i) => (
                <PartialBottleRow
                  key={i}
                  index={i}
                  value={val}
                  maxLitres={wineVolumeLitres}
                  glassDimensions={glassDimensions}
                  onChange={(l) => updatePartial(i, l)}
                />
              ))}
            </div>
          )}

          {/* Summary */}
          {!compact && (unopened > 0 || openedCount > 0) && (
            <div className="bg-secondary/30 rounded-lg p-3 flex justify-around text-center">
              <div>
                <span className="text-xs text-muted-foreground block">In Bottles</span>
                <span className="text-lg font-heading font-bold">{totalBtl.toFixed(2)} btl</span>
              </div>
              <div className="w-px bg-border" />
              <div>
                <span className="text-xs text-muted-foreground block">In Litres</span>
                <span className="text-lg font-heading font-bold">{totalLitres.toFixed(3)}L</span>
              </div>
            </div>
          )}

          {/* Notes */}
          {!compact && (
            <div>
              <Label className="text-sm mb-1 block">Notes (optional)</Label>
              <Textarea
                placeholder="e.g., Damaged label..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-secondary border-border text-sm h-16"
              />
            </div>
          )}

          <Button
            onClick={handleConfirm}
            disabled={unopened + openedCount === 0 && !compact}
            className="w-full h-12 text-base font-semibold wine-gradient text-primary-foreground hover:opacity-90"
          >
            <Check className="w-4 h-4 mr-2" />
            {compact
              ? `Save (${unopened})`
              : `Confirm (${totalBtl.toFixed(2)} btl / ${totalLitres.toFixed(3)}L)`}
          </Button>
        </div>
      </div>
    </div>
  );
}
