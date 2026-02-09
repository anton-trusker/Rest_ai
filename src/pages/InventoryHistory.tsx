import { useState } from 'react';
import { mockMovements } from '@/data/mockWines';
import { useAuthStore } from '@/stores/authStore';
import { Search, Camera, Scan, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function MethodIcon({ method }: { method: string }) {
  if (method === 'barcode') return <Scan className="w-4 h-4" />;
  if (method === 'image_ai') return <Camera className="w-4 h-4" />;
  return <Search className="w-4 h-4" />;
}

export default function InventoryHistory() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [methodFilter, setMethodFilter] = useState('all');
  const [search, setSearch] = useState('');

  const movements = (isAdmin ? mockMovements : mockMovements.filter(m => m.userId === user?.id))
    .filter(m => {
      if (methodFilter !== 'all' && m.method !== methodFilter) return false;
      if (search && !m.wineName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });

  const formatDate = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-heading font-bold">{isAdmin ? 'History & Audit' : 'My History'}</h1>
        <p className="text-muted-foreground mt-1">{movements.length} entries</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search wine..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-11 bg-card border-border" />
        </div>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-[180px] h-11 bg-card border-border">
            <SelectValue placeholder="Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="manual">Manual Search</SelectItem>
            <SelectItem value="barcode">Barcode</SelectItem>
            <SelectItem value="image_ai">Image AI</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="wine-glass-effect rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left p-4 font-medium">Timestamp</th>
                {isAdmin && <th className="text-left p-4 font-medium">User</th>}
                <th className="text-left p-4 font-medium">Wine</th>
                <th className="text-left p-4 font-medium">Method</th>
                <th className="text-center p-4 font-medium">Closed</th>
                <th className="text-center p-4 font-medium">Open</th>
                <th className="text-center p-4 font-medium">Total</th>
                {isAdmin && <th className="text-center p-4 font-medium">Confidence</th>}
              </tr>
            </thead>
            <tbody>
              {movements.map(m => (
                <tr key={m.id} className="border-b border-border/50 hover:bg-wine-surface-hover transition-colors">
                  <td className="p-4 text-muted-foreground whitespace-nowrap">
                    <Clock className="w-3 h-3 inline mr-1" />{formatDate(m.timestamp)}
                  </td>
                  {isAdmin && <td className="p-4 font-medium">{m.userName}</td>}
                  <td className="p-4">{m.wineName}</td>
                  <td className="p-4">
                    <span className="wine-badge bg-secondary text-secondary-foreground">
                      <MethodIcon method={m.method} />
                      <span className="ml-1 capitalize">{m.method.replace('_', ' ')}</span>
                    </span>
                  </td>
                  <td className="p-4 text-center">{m.unopened}</td>
                  <td className="p-4 text-center text-muted-foreground">{m.opened}</td>
                  <td className="p-4 text-center font-semibold">{m.unopened + m.opened}</td>
                  {isAdmin && <td className="p-4 text-center">{m.confidence ? `${m.confidence}%` : '—'}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
