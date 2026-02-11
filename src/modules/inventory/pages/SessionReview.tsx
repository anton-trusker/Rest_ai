import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useSessionStore } from '@/core/lib/sessionStore';
import { useAuthStore } from '@/core/auth/authStore';
import { useColumnStore } from '@/core/settings/columnStore';
import {
    CheckCircle2, AlertTriangle, Clock, ChevronRight, Check, X, Eye
} from 'lucide-react';
import { Button } from '@/core/ui/button';
import {
    Card, CardHeader, CardTitle, CardContent, CardFooter
} from '@/core/ui/card';
import DataTable, { DataTableColumn } from '@/core/ui/DataTable';
import { InventorySession, InventoryItem } from '@/core/lib/mockData';

export default function SessionReview() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { sessions, getSessionStatusColor, approveSession, getFormattedItems } = useSessionStore();
    const { columnWidths, setColumnWidth } = useColumnStore();

    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

    const selectedSession = useMemo(() =>
        sessions.find(s => s.id === selectedSessionId),
        [sessions, selectedSessionId]);

    const sessionItems = useMemo(() =>
        selectedSessionId ? getFormattedItems(selectedSessionId) : [],
        [selectedSessionId, getFormattedItems]);

    const handleApprove = () => {
        if (selectedSessionId && user) {
            approveSession(selectedSessionId, user.id);
            toast.success('Session Approved', { description: 'Inventory levels have been updated.' });
        }
    };

    const itemsColumns: DataTableColumn<InventoryItem>[] = [
        { key: 'wine', label: 'Wine', minWidth: 200, render: i => i.wineName },
        {
            key: 'expected', label: 'Expected', minWidth: 100, align: 'right',
            render: i => <span className="text-muted-foreground">{i.expectedUnopened}</span>
        },
        {
            key: 'counted', label: 'Counted', minWidth: 100, align: 'right',
            render: i => <span className="font-bold">{i.countedUnopened}</span>
        },
        {
            key: 'variance', label: 'Variance', minWidth: 100, align: 'right',
            render: i => {
                if (i.varianceUnopened === 0) return <span className="text-muted-foreground">-</span>;
                const isPos = i.varianceUnopened > 0;
                return (
                    <span className={`font-bold ${isPos ? 'text-wine-success' : 'text-destructive'}`}>
                        {isPos ? '+' : ''}{i.varianceUnopened}
                    </span>
                );
            }
        },
        {
            key: 'action', label: 'Action', minWidth: 100, align: 'center',
            render: i => (
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full">
                    <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
            )
        }
    ];

    if (selectedSession) {
        return (
            <div className="h-[calc(100vh-6rem)] flex flex-col animate-fade-in space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => setSelectedSessionId(null)}>
                            <ChevronRight className="w-4 h-4 rotate-180" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-heading font-bold">{selectedSession.sessionName}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold border ${getSessionStatusColor(selectedSession.status)}`}>
                                    {selectedSession.status}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {new Date(selectedSession.startedAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {selectedSession.status === 'completed' && (
                        <div className="flex gap-2">
                            <Button variant="destructive" className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20 border">
                                <X className="w-4 h-4 mr-2" /> Reject
                            </Button>
                            <Button className="wine-gradient" onClick={handleApprove}>
                                <Check className="w-4 h-4 mr-2" /> Approve
                            </Button>
                        </div>
                    )}
                </div>

                {/* Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Accuracy</CardTitle></CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">98.5%</div>
                            <p className="text-xs text-muted-foreground">Based on variance</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Variance</CardTitle></CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-destructive">-3</div>
                            <p className="text-xs text-muted-foreground">Bottles missing</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Duration</CardTitle></CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{Math.round((selectedSession.duration || 0) / 60)} min</div>
                            <p className="text-xs text-muted-foreground">Avg. 12 sec / item</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Items Table */}
                <div className="flex-1 bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
                    <DataTable
                        data={sessionItems}
                        columns={itemsColumns}
                        visibleColumns={['wine', 'expected', 'counted', 'variance', 'action']}
                        columnWidths={columnWidths}
                        onColumnResize={setColumnWidth}
                        keyExtractor={i => i.id}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-heading font-bold">Session Review</h1>
                <p className="text-muted-foreground mt-1">Approve pending inventory counts</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.map(session => (
                    <div
                        key={session.id}
                        onClick={() => setSelectedSessionId(session.id)}
                        className="group wine-glass-effect p-6 rounded-2xl cursor-pointer hover:border-primary/50 transition-all hover:-translate-y-1"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${session.status === 'completed' ? 'bg-blue-500/10 text-blue-500' : 'bg-secondary text-muted-foreground'}`}>
                                <Clock className="w-6 h-6" />
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold border ${getSessionStatusColor(session.status)}`}>
                                {session.status}
                            </span>
                        </div>

                        <h3 className="font-heading font-bold text-lg mb-1 group-hover:text-primary transition-colors">{session.sessionName}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            by {session.createdByName} · {new Date(session.startedAt).toLocaleDateString()}
                        </p>

                        <div className="flex items-center justify-between text-sm py-3 border-t border-border/50">
                            <span className="text-muted-foreground">Items Counted</span>
                            <span className="font-mono font-bold">{session.totalWinesCounted}/{session.totalWinesExpected}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
