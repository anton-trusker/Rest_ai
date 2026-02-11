import { useNavigate } from 'react-router-dom';
import { InventorySession } from '@/core/lib/mockData';
import { Button } from '@/core/ui/button';
import { CheckCircle2, AlertCircle, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface SessionSummaryProps {
    session: InventorySession | null;
    count: number;
}

export default function SessionSummary({ session, count }: SessionSummaryProps) {
    const navigate = useNavigate();

    if (!session) return null;

    const durationMinutes = session.duration ? Math.round(session.duration / 60) : 0;
    const variance = session.totalWinesCounted - session.totalWinesExpected;

    return (
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-8 animate-in zoom-in-95 duration-500">
            <div className="flex flex-col items-center space-y-4">
                <div className="w-20 h-20 bg-wine-success/10 rounded-full flex items-center justify-center mb-2 animate-bounce-slow">
                    <CheckCircle2 className="w-10 h-10 text-wine-success" />
                </div>
                <h2 className="text-2xl font-heading font-bold">Session Completed!</h2>
                <p className="text-muted-foreground max-w-xs">{session.sessionName} has been recorded.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <div className="bg-card border border-border rounded-xl p-4 flex flex-col items-center">
                    <span className="text-3xl font-bold font-mono text-primary">{count}</span>
                    <span className="text-xs text-muted-foreground uppercase mt-1">Items Counted</span>
                </div>
                <div className="bg-card border border-border rounded-xl p-4 flex flex-col items-center">
                    <div className="flex items-center gap-1.5 text-2xl font-bold font-mono">
                        <Clock className="w-4 h-4 text-muted-foreground mt-1" />
                        {durationMinutes} <span className="text-sm font-normal text-muted-foreground self-end mb-1">min</span>
                    </div>
                    <span className="text-xs text-muted-foreground uppercase mt-1">Duration</span>
                </div>
            </div>

            {variance !== 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg p-3 flex items-center gap-3 w-full max-w-sm text-sm text-left">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <div>
                        <span className="font-semibold block">Variance Detected</span>
                        <span>Stock differs by {variance > 0 ? '+' : ''}{variance} units from expected.</span>
                    </div>
                </div>
            )}

            <div className="w-full max-w-sm space-y-3">
                <Button className="w-full h-12 text-lg wine-gradient" onClick={() => navigate('/inventory/history')}>
                    <FileText className="w-4 h-4 mr-2" /> View Report
                </Button>
                <Button variant="outline" className="w-full h-12" onClick={() => window.location.reload()}>
                    Start New Inventory
                </Button>
            </div>
        </div>
    );
}
