
import { useEffect, useState, useCallback } from "react";
import { Plus, Edit2 } from "lucide-react";
import { supabase } from "@/core/lib/supabase/client";
import { Button } from "@/core/ui/button";
import {
    Card,
    CardContent,
} from "@/core/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/core/ui/dialog";
import { Input } from "@/core/ui/input";
import { Label } from "@/core/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/core/ui/table";
import { useToast } from "@/core/ui/use-toast";
import { Switch } from "@/core/ui/switch";
import { Separator } from "@/core/ui/separator";

interface GlassDimension {
    id: string;
    name: string;
    volume_ml: number;
    is_default: boolean;
    is_active: boolean;
    sort_order: number;
}

export default function GlassSettings() {
    const [glasses, setGlasses] = useState<GlassDimension[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingGlass, setEditingGlass] = useState<GlassDimension | null>(null);
    const { toast } = useToast();

    // Form state
    const [name, setName] = useState("");
    const [volume, setVolume] = useState("");

    useEffect(() => {
        fetchGlasses();
    }, [fetchGlasses]);

    const fetchGlasses = useCallback(async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('glass_dimensions')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) {
            toast({
                title: "Error",
                description: "Failed to load glass sizes.",
                variant: "destructive",
            });
        } else {
            setGlasses(data || []);
        }
        setIsLoading(false);
    }, [toast]);

    const handleOpenDialog = (glass?: GlassDimension) => {
        if (glass) {
            setEditingGlass(glass);
            setName(glass.name);
            setVolume(glass.volume_ml.toString());
        } else {
            setEditingGlass(null);
            setName("");
            setVolume("");
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!name || !volume) return;

        const volNum = parseFloat(volume);
        if (isNaN(volNum)) {
            toast({ title: "Invalid volume", variant: "destructive" });
            return;
        }

        const payload = {
            name,
            volume_ml: volNum,
            // Simple auto-sort for new items
            sort_order: editingGlass ? editingGlass.sort_order : (glasses.length + 1) * 10
        };

        let error;
        if (editingGlass) {
            const res = await supabase
                .from('glass_dimensions')
                .update(payload)
                .eq('id', editingGlass.id);
            error = res.error;
        } else {
            const res = await supabase
                .from('glass_dimensions')
                .insert([payload]);
            error = res.error;
        }

        if (error) {
            toast({
                title: "Error",
                description: "Failed to save glass dimension.",
                variant: "destructive",
            });
        } else {
            toast({
                title: "Success",
                description: editingGlass ? "Glass dimension updated." : "Glass dimension created.",
            });
            fetchGlasses();
            setIsDialogOpen(false);
        }
    };

    const toggleActive = async (glass: GlassDimension) => {
        const { error } = await supabase
            .from('glass_dimensions')
            .update({ is_active: !glass.is_active })
            .eq('id', glass.id);

        if (error) {
            toast({
                title: "Error",
                description: "Failed to update status.",
                variant: "destructive",
            });
        } else {
            setGlasses(glasses.map(g => g.id === glass.id ? { ...g, is_active: !g.is_active } : g));
        }
    };

    const toggleDefault = async (glass: GlassDimension) => {
        // Can't uncheck default directly, must check another one or keep it
        if (glass.is_default) return;

        // Unset old default
        await supabase.from('glass_dimensions').update({ is_default: false }).eq('is_default', true);

        // Set new default
        const { error } = await supabase
            .from('glass_dimensions')
            .update({ is_default: true })
            .eq('id', glass.id);

        if (error) {
            toast({
                title: "Error",
                description: "Failed to set default.",
                variant: "destructive",
            });
            fetchGlasses(); // Re-fetch to sync
        } else {
            fetchGlasses();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Glass Sizes</h3>
                    <p className="text-sm text-muted-foreground">
                        Standard pour volumes for partial bottle counting.
                    </p>
                </div>
                <Button onClick={() => handleOpenDialog()} className="gap-2">
                    <Plus className="h-4 w-4" /> Add Glass Size
                </Button>
            </div>
            <Separator />

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Volume (ml)</TableHead>
                                <TableHead>Default</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell>
                                </TableRow>
                            ) : glasses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No glass sizes found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                glasses.map((glass) => (
                                    <TableRow key={glass.id} className={!glass.is_active ? "opacity-50" : ""}>
                                        <TableCell className="font-medium">{glass.name}</TableCell>
                                        <TableCell>{glass.volume_ml} ml</TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={glass.is_default}
                                                onCheckedChange={() => toggleDefault(glass)}
                                                disabled={glass.is_default} // Prevent unchecking current default
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={glass.is_active}
                                                onCheckedChange={() => toggleActive(glass)}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(glass)}>
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingGlass ? "Edit Glass Size" : "Add Glass Size"}</DialogTitle>
                        <DialogDescription>
                            Configure the volume for this glass type.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="col-span-3"
                                placeholder="e.g. Small Wine"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="volume" className="text-right">Volume (ml)</Label>
                            <Input
                                id="volume"
                                type="number"
                                value={volume}
                                onChange={(e) => setVolume(e.target.value)}
                                className="col-span-3"
                                placeholder="e.g. 125"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
