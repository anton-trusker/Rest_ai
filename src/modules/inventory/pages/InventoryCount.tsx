import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/core/lib/supabase/client";
import { useAuthStore } from "@/core/auth/authStore";
import { Button } from "@/core/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/core/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/core/ui/table";
import { Badge } from "@/core/ui/badge";
import { Link } from "react-router-dom";
import { Plus, Clock, CheckCircle2 } from "lucide-react";

interface Session {
    id: string;
    session_type: string;
    status: string;
    started_at: string;
    completed_at: string | null;
    location_id: string | null;
    locations?: {
        name: string;
    };
}

export default function InventoryCount() {
    const { user } = useAuthStore();

    const { data: sessions, isLoading } = useQuery({
        queryKey: ['inventory-sessions'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('inventory_sessions')
                .select(`
                    *,
                    locations(name)
                `)
                .order('started_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            return data as Session[];
        },
    });

    const activeSessions = sessions?.filter(s => s.status === 'draft' || s.status === 'in_progress');
    const recentSessions = sessions?.filter(s => s.status === 'completed' || s.status === 'approved');

    const getStatusBadge = (status: string) => {
        const variants: Record<string, any> = {
            'draft': 'outline',
            'in_progress': 'default',
            'completed': 'secondary',
            'approved': 'default',
        };
        return <Badge variant={variants[status] || 'outline'}>{status.replace('_', ' ')}</Badge>;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Inventory Counting</h1>
                    <p className="text-muted-foreground">
                        Manage counting sessions
                    </p>
                </div>
                <Button asChild size="lg">
                    <Link to="/inventory/new">
                        <Plus className="mr-2 h-4 w-4" />
                        New Count
                    </Link>
                </Button>
            </div>

            {/* Active Sessions */}
            {activeSessions && activeSessions.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Active Sessions
                        </CardTitle>
                        <CardDescription>
                            Continue counting or complete these sessions
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {activeSessions.map((session) => (
                                <Link
                                    key={session.id}
                                    to={`/inventory/session/${session.id}`}
                                    className="block"
                                >
                                    <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                                        <div>
                                            <p className="font-medium capitalize">{session.session_type} Count</p>
                                            <p className="text-sm text-muted-foreground">
                                                {session.locations?.name || 'All Locations'} • Started {new Date(session.started_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {getStatusBadge(session.status)}
                                            <Button variant="ghost" size="sm">
                                                Continue →
                                            </Button>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recent Sessions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        Recent Sessions
                    </CardTitle>
                    <CardDescription>
                        Previously completed counts
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p className="text-center py-8 text-muted-foreground">Loading sessions...</p>
                    ) : !recentSessions || recentSessions.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">
                            No completed sessions yet. Start your first count!
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Started</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentSessions.map((session) => (
                                    <TableRow key={session.id}>
                                        <TableCell className="capitalize">{session.session_type}</TableCell>
                                        <TableCell>{session.locations?.name || '—'}</TableCell>
                                        <TableCell>{new Date(session.started_at).toLocaleDateString()}</TableCell>
                                        <TableCell>{getStatusBadge(session.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link to={`/inventory/session/${session.id}`}>
                                                    View
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
