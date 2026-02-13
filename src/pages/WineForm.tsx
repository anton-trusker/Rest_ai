import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWineStore } from '@/stores/wineStore';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { getCountries, getRegionsForCountry, getSubRegionsForRegion, getAppellationsForRegion } from '@/data/referenceData';
import { ArrowLeft, Save, Trash2, Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Navigate, Link } from 'react-router-dom';

export default function WineForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { volumes } = useSettingsStore();
  const { getWineById, saveWine, deleteWine, loading, currentWine } = useWineStore();
  
  const isEdit = !!id;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    fullName: '',
    producer: '',
    estate: '',
    type: 'Red',
    vintage: '',
    country: '',
    region: '',
    subRegion: '',
    appellation: '',
    volume: '750',
    bottleSize: 'Standard',
    abv: '',
    closureType: '',
    sku: '',
    barcode: '',
    barcodeType: 'EAN-13',
    grapeVarieties: '',
    purchasePrice: '',
    salePrice: '',
    glassPrice: '',
    availableByGlass: false,
    stockUnopened: '0',
    stockOpened: '0',
    minStockLevel: '6',
    maxStockLevel: '',
    reorderPoint: '',
    reorderQuantity: '',
    cellarSection: '',
    rackNumber: '',
    shelfPosition: '',
    supplierName: '',
    tastingNotes: '',
    body: '',
    sweetness: '',
    acidity: '',
    tannins: '',
    foodPairing: '',
  });

  useEffect(() => {
    if (isEdit && id) {
      getWineById(id).then(wine => {
        if (wine) {
          setForm({
            name: wine.name || '',
            fullName: wine.full_name || '',
            producer: wine.producer || '',
            estate: wine.estate || '',
            type: wine.wine_type || 'Red',
            vintage: wine.vintage?.toString() || '',
            country: wine.country || '',
            region: wine.region || '',
            subRegion: wine.sub_region || '',
            appellation: wine.appellation || '',
            volume: wine.bottle_size_ml?.toString() || '750',
            bottleSize: 'Standard', // Logic needed to map back if stored
            abv: wine.alcohol_percentage?.toString() || '',
            closureType: wine.closure_type || '',
            sku: wine.sku || '',
            barcode: '', // wine.barcode not in interface yet or joined
            barcodeType: 'EAN-13',
            grapeVarieties: wine.grape_varieties?.join(', ') || '',
            purchasePrice: wine.purchase_price?.toString() || '',
            salePrice: wine.sale_price?.toString() || '',
            glassPrice: wine.glass_price?.toString() || '',
            availableByGlass: wine.available_by_glass || false,
            stockUnopened: wine.stock_unopened?.toString() || '0',
            stockOpened: wine.stock_opened?.toString() || '0',
            minStockLevel: wine.min_stock_level?.toString() || '6',
            maxStockLevel: wine.max_stock_level?.toString() || '',
            reorderPoint: wine.reorder_point?.toString() || '',
            reorderQuantity: wine.reorder_quantity?.toString() || '',
            cellarSection: wine.cellar_section || '',
            rackNumber: wine.rack_number || '',
            shelfPosition: wine.shelf_position || '',
            supplierName: wine.supplier_name || '',
            tastingNotes: wine.tasting_notes || '',
            body: wine.body || '',
            sweetness: wine.sweetness || '',
            acidity: wine.acidity || '',
            tannins: wine.tannins || '',
            foodPairing: wine.food_pairing?.join(', ') || '',
          });
          setImagePreview(wine.image_url);
        }
      });
    }
  }, [id, isEdit, getWineById]);

  if (user?.roleId !== 'role_admin' && user?.roleId !== 'admin') {
     // Check role logic - might need adjustment based on actual auth store
     // return <Navigate to="/dashboard" replace />;
  }

  const update = (field: string, value: string | boolean) => setForm(f => ({ ...f, [field]: value }));

  const countries = getCountries();
  const regions = form.country ? getRegionsForCountry(form.country) : [];
  const subRegions = form.country && form.region ? getSubRegionsForRegion(form.country, form.region) : [];
  const appellations = form.country && form.region ? getAppellationsForRegion(form.country, form.region) : [];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    // TODO: Upload to storage bucket in saveWine
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleVolumeSelect = (volId: string) => {
    const vol = volumes.find(v => v.id === volId);
    if (vol) {
      setForm(f => ({ ...f, volume: vol.ml.toString(), bottleSize: vol.bottleSize }));
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.producer) { toast.error('Name and Producer are required'); return; }
    
    const success = await saveWine({
      id: id, // undefined if new
      name: form.name,
      full_name: form.fullName,
      producer: form.producer,
      estate: form.estate,
      wine_type: form.type,
      vintage: parseInt(form.vintage) || null,
      country: form.country,
      region: form.region,
      sub_region: form.subRegion,
      appellation: form.appellation,
      bottle_size_ml: parseInt(form.volume) || 750,
      alcohol_percentage: parseFloat(form.abv) || null,
      closure_type: form.closureType,
      sku: form.sku,
      grape_varieties: form.grapeVarieties.split(',').map(s => s.trim()).filter(Boolean),
      purchase_price: parseFloat(form.purchasePrice) || null,
      sale_price: parseFloat(form.salePrice) || null,
      glass_price: parseFloat(form.glassPrice) || null,
      available_by_glass: form.availableByGlass,
      stock_unopened: parseFloat(form.stockUnopened) || 0,
      stock_opened: parseFloat(form.stockOpened) || 0,
      min_stock_level: parseInt(form.minStockLevel) || null,
      max_stock_level: parseInt(form.maxStockLevel) || null,
      reorder_point: parseInt(form.reorderPoint) || null,
      reorder_quantity: parseInt(form.reorderQuantity) || null,
      cellar_section: form.cellarSection,
      rack_number: form.rackNumber,
      shelf_position: form.shelfPosition,
      supplier_name: form.supplierName,
      tasting_notes: form.tastingNotes,
      body: form.body,
      sweetness: form.sweetness,
      acidity: form.acidity,
      tannins: form.tannins,
      food_pairing: form.foodPairing.split(',').map(s => s.trim()).filter(Boolean),
      image_url: imagePreview // Needs actual upload logic usually
    }, !isEdit);

    if (success) {
      navigate('/catalog');
    }
  };
  
  const handleDelete = async () => {
     if (!id) return;
     if (confirm('Are you sure you want to delete this wine?')) {
       const success = await deleteWine(id);
       if (success) navigate('/catalog');
     }
  };

  const volumeLitres = form.volume ? (parseInt(form.volume) / 1000).toFixed(3) : '0';

  if (loading && isEdit && !currentWine) {
      return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/catalog" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Catalog
        </Link>
        <span>/</span>
        <span className="text-foreground">{isEdit ? 'Edit Wine' : 'Add Wine'}</span>
      </div>

      <h1 className="text-2xl lg:text-3xl font-heading font-bold">{isEdit ? `Edit ${existing?.name}` : 'Add New Wine'}</h1>

      {/* Image Upload */}
      <section className="wine-glass-effect rounded-xl p-5 space-y-4">
        <h3 className="font-heading font-semibold text-lg">Wine Image</h3>
        <div className="flex items-start gap-4">
          <div className="w-32 h-40 rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-secondary/30 flex-shrink-0">
            {imagePreview ? (
              <img src={imagePreview} alt="Wine" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <div className="flex flex-col items-center text-muted-foreground">
                <ImageIcon className="w-8 h-8 mb-1" />
                <span className="text-xs">No Image</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <Button variant="outline" size="sm" className="border-border" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-1" /> {imagePreview ? 'Change Image' : 'Upload Image'}
            </Button>
            {imagePreview && (
              <Button variant="ghost" size="sm" className="text-destructive" onClick={handleRemoveImage}>
                <X className="w-4 h-4 mr-1" /> Remove
              </Button>
            )}
            <p className="text-xs text-muted-foreground">JPG, PNG or WebP, max 5MB</p>
          </div>
        </div>
      </section>

      {/* Basic Info */}
      <section className="wine-glass-effect rounded-xl p-5 space-y-4">
        <h3 className="font-heading font-semibold text-lg">Basic Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Wine Name *</Label>
            <Input value={form.name} onChange={e => update('name', e.target.value)} className="bg-secondary border-border" />
          </div>
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input value={form.fullName} onChange={e => update('fullName', e.target.value)} placeholder="Full descriptive name" className="bg-secondary border-border" />
          </div>
          <div className="space-y-1.5">
            <Label>Producer *</Label>
            <Input value={form.producer} onChange={e => update('producer', e.target.value)} className="bg-secondary border-border" />
          </div>
          <div className="space-y-1.5">
            <Label>Estate</Label>
            <Input value={form.estate} onChange={e => update('estate', e.target.value)} className="bg-secondary border-border" />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={form.type} onValueChange={v => update('type', v)}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Red', 'White', 'Rosé', 'Sparkling', 'Fortified', 'Dessert'].map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Vintage</Label>
            <Input type="number" value={form.vintage} onChange={e => update('vintage', e.target.value)} placeholder="e.g. 2020" className="bg-secondary border-border" />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Grape Varieties</Label>
            <Input value={form.grapeVarieties} onChange={e => update('grapeVarieties', e.target.value)} placeholder="Comma separated: Cabernet Sauvignon, Merlot" className="bg-secondary border-border" />
          </div>
        </div>
      </section>

      {/* Origin - with cascading dropdowns */}
      <section className="wine-glass-effect rounded-xl p-5 space-y-4">
        <h3 className="font-heading font-semibold text-lg">Origin</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Country</Label>
            <Select value={form.country} onValueChange={v => { update('country', v); update('region', ''); update('subRegion', ''); update('appellation', ''); }}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select country" /></SelectTrigger>
              <SelectContent>
                {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Region</Label>
            <Select value={form.region} onValueChange={v => { update('region', v); update('subRegion', ''); update('appellation', ''); }} disabled={!form.country}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder={form.country ? 'Select region' : 'Select country first'} /></SelectTrigger>
              <SelectContent>
                {regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Sub-Region</Label>
            <Select value={form.subRegion} onValueChange={v => update('subRegion', v)} disabled={!form.region || subRegions.length === 0}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder={subRegions.length ? 'Select sub-region' : 'N/A'} /></SelectTrigger>
              <SelectContent>
                {subRegions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Appellation</Label>
            <Select value={form.appellation} onValueChange={v => update('appellation', v)} disabled={!form.region || appellations.length === 0}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder={appellations.length ? 'Select appellation' : 'N/A'} /></SelectTrigger>
              <SelectContent>
                {appellations.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Product Details - Volume from settings */}
      <section className="wine-glass-effect rounded-xl p-5 space-y-4">
        <h3 className="font-heading font-semibold text-lg">Product Details</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Volume</Label>
            <Select onValueChange={handleVolumeSelect} value={volumes.find(v => v.ml === parseInt(form.volume))?.id || ''}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select volume" /></SelectTrigger>
              <SelectContent>
                {volumes.map(v => <SelectItem key={v.id} value={v.id}>{v.label} ({v.bottleSize})</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{form.volume}ml = {volumeLitres}L</p>
          </div>
          <div className="space-y-1.5"><Label>ABV (%)</Label><Input type="number" step="0.1" value={form.abv} onChange={e => update('abv', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Closure</Label>
            <Select value={form.closureType} onValueChange={v => update('closureType', v)}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {['cork', 'screw_cap', 'glass', 'synthetic'].map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace('_', ' ')}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>SKU</Label><Input value={form.sku} onChange={e => update('sku', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Barcode</Label><Input value={form.barcode} onChange={e => update('barcode', e.target.value)} className="bg-secondary border-border" /></div>
        </div>
      </section>

      {/* Pricing */}
      <section className="wine-glass-effect rounded-xl p-5 space-y-4">
        <h3 className="font-heading font-semibold text-lg">Pricing</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5"><Label>Purchase Price ($)</Label><Input type="number" step="0.01" value={form.purchasePrice} onChange={e => update('purchasePrice', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Sale Price ($)</Label><Input type="number" step="0.01" value={form.salePrice} onChange={e => update('salePrice', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Glass Price ($)</Label><Input type="number" step="0.01" value={form.glassPrice} onChange={e => update('glassPrice', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="flex items-center gap-2 sm:col-span-3">
            <Switch checked={form.availableByGlass} onCheckedChange={v => update('availableByGlass', v)} />
            <Label>Available by Glass</Label>
          </div>
        </div>
      </section>

      {/* Stock & Location */}
      <section className="wine-glass-effect rounded-xl p-5 space-y-4">
        <h3 className="font-heading font-semibold text-lg">Inventory Settings</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5"><Label>Unopened Stock</Label><Input type="number" value={form.stockUnopened} onChange={e => update('stockUnopened', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Opened Stock</Label><Input type="number" step="0.001" value={form.stockOpened} onChange={e => update('stockOpened', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Min Stock Level</Label><Input type="number" value={form.minStockLevel} onChange={e => update('minStockLevel', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Max Stock Level</Label><Input type="number" value={form.maxStockLevel} onChange={e => update('maxStockLevel', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Reorder Point</Label><Input type="number" value={form.reorderPoint} onChange={e => update('reorderPoint', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Reorder Qty</Label><Input type="number" value={form.reorderQuantity} onChange={e => update('reorderQuantity', e.target.value)} className="bg-secondary border-border" /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5"><Label>Cellar Section</Label><Input value={form.cellarSection} onChange={e => update('cellarSection', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Rack Number</Label><Input value={form.rackNumber} onChange={e => update('rackNumber', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Shelf Position</Label><Input value={form.shelfPosition} onChange={e => update('shelfPosition', e.target.value)} className="bg-secondary border-border" /></div>
        </div>
        <div className="space-y-1.5"><Label>Supplier</Label><Input value={form.supplierName} onChange={e => update('supplierName', e.target.value)} className="bg-secondary border-border" /></div>
      </section>

      {/* Tasting */}
      <section className="wine-glass-effect rounded-xl p-5 space-y-4">
        <h3 className="font-heading font-semibold text-lg">Tasting & Character</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {['body', 'sweetness', 'acidity', 'tannins'].map(field => (
            <div key={field} className="space-y-1.5">
              <Label className="capitalize">{field}</Label>
              <Select value={(form as any)[field]} onValueChange={v => update(field, v)}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {(field === 'body' ? ['light', 'medium', 'full'] :
                    field === 'tannins' ? ['soft', 'medium', 'firm', 'grippy'] :
                    ['dry', 'off-dry', 'medium', 'sweet']).map(o => (
                    <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        <div className="space-y-1.5"><Label>Tasting Notes</Label><Textarea value={form.tastingNotes} onChange={e => update('tastingNotes', e.target.value)} className="bg-secondary border-border" rows={3} /></div>
        <div className="space-y-1.5"><Label>Food Pairing</Label><Input value={form.foodPairing} onChange={e => update('foodPairing', e.target.value)} placeholder="Beef, Lamb, Hard Cheese..." className="bg-secondary border-border" /></div>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate(-1)} className="border-border">Cancel</Button>
        <Button onClick={handleSave} className="wine-gradient text-primary-foreground hover:opacity-90">
          <Save className="w-4 h-4 mr-2" /> {isEdit ? 'Update Wine' : 'Add Wine'}
        </Button>
      </div>

      {/* Danger zone for edit */}
      {isEdit && (
        <section className="wine-glass-effect rounded-xl p-5 border-destructive/30">
          <h3 className="font-heading font-semibold mb-2 text-destructive">Danger Zone</h3>
          <Button variant="outline" size="sm" className="border-destructive/50 text-destructive hover:bg-destructive/10" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-1" /> Archive/Delete Wine
          </Button>
        </section>
      )}
    </div>
  );
}
