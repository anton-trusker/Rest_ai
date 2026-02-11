import { Button } from '@/core/ui/button';
import { Card, CardContent } from '@/core/ui/card';
import { Textarea } from '@/core/ui/textarea';
import { Label } from '@/core/ui/label';
import { MapPin, ListChecks, CheckSquare } from 'lucide-react';

interface CountSetupProps {
    onStart: () => void;
}

export default function CountSetup({ onStart }: CountSetupProps) {
    return (
        <div className="bg-card w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="p-6 pb-2">
                <h2 className="text-xl font-heading font-bold mb-1">Start New Count</h2>
                <p className="text-sm text-muted-foreground">Configure your inventory session</p>
            </div>

            <div className="p-6 pt-2 space-y-6">
                <div className="space-y-3">
                    <Label>Count Type</Label>
                    <div className="grid grid-cols-2 gap-3">
                        <button className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-primary bg-primary/5 text-primary transition-all">
                            <ListChecks className="w-6 h-6 mb-2" />
                            <span className="text-sm font-bold">Full Count</span>
                        </button>
                        <button className="flex flex-col items-center justify-center p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-secondary/50 transition-all opacity-60">
                            <CheckSquare className="w-6 h-6 mb-2" />
                            <span className="text-sm font-medium">Spot Check</span>
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    <Label>Location (Optional)</Label>
                    <button className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-secondary/20 hover:bg-secondary/40 text-left transition-colors">
                        <span className="text-sm flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4" /> All Locations
                        </span>
                    </button>
                </div>

                <div className="space-y-2">
                    <Label>Session Notes</Label>
                    <Textarea placeholder="E.g. Monthly audit..." className="bg-secondary/20 resize-none h-20" />
                </div>

                <Button onClick={onStart} className="w-full h-12 text-lg font-semibold wine-gradient shadow-lg">
                    Start Counting
                </Button>
            </div>
        </div>
    );
}
