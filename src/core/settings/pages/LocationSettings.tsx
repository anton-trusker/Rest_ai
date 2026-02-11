
import { useEffect, useState } from "react";
import { Plus, Trash2, Edit2, Archive, ArchiveRestore } from "lucide-react";
import { supabase } from "@/core/lib/supabase/client";
import { Button } from "@/core/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/core/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/core/ui/select";
import { Separator } from "@/core/ui/separator";

interface Location {
    id: string;
    name: string;
    description: string | null;
    location_type: string | null;
    is_active: boolean;
    sort_order: number;
}

export default function LocationSettings() {
    const [locations, setLocations] = useState<Location[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);
    const { toast } = useToast();

    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState("bar");

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('locations')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) {
            toast({
                title: "Error",
                description: "Failed to load locations.",
                variant: "destructive",
            });
        } else {
            setLocations(data || []);
        }
        setIsLoading(false);
    };

    const handleOpenDialog = (location?: Location) => {
        if (location) {
            setEditingLocation(location);
            setName(location.name);
            setDescription(location.description || "");
            setType(location.location_type || "bar");
        } else {
            setEditingLocation(null);
            setName("");
            setDescription("");
            setType("bar");
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!name) return;

        const payload = {
            name,
            description,
            location_type: type,
            // Simple auto-sort for new items
            sort_order: editingLocation ? editingLocation.sort_order : (locations.length + 1) * 10
        };

        let error;
        if (editingLocation) {
            const res = await supabase
                .from('locations')
                .update(payload)
                .eq('id', editingLocation.id);
            error = res.error;
        } else {
            const res = await supabase
                .from('locations')
                .insert([payload]);
            error = res.error;
        }

        if (error) {
            toast({
                title: "Error",
                description: "Failed to save location.",
                variant: "destructive",
            });
        } else {
            toast({
                title: "Success",
                description: editingLocation ? "Location updated." : "Location created.",
            });
            fetchLocations();
            setIsDialogOpen(false);
        }
    };

    const toggleActive = async (location: Location) => {
        const { error } = await supabase
            .from('locations')
            .update({ is_active: !location.is_active })
            .eq('id', location.id);

        if (error) {
            toast({
                title: "Error",
                description: "Failed to update status.",
                variant: "destructive",
            });
        } else {
            // Optimistic update
            setLocations(locations.map(l => l.id === location.id ? { ...l, is_active: !l.is_active } : l));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Locations</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage storage areas, bars, and kitchen locations where stock is held.
                    </p>
                </div>
                <Button onClick={() => handleOpenDialog()} className="gap-2">
                    <Plus className="h-4 w-4" /> Add Location
                </Button>
            </div>
            <Separator />

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">Loading...</TableCell>
                                </TableRow>
                            ) : locations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        No locations found. Add one to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                locations.map((location) => (
                                    <TableRow key={location.id} className={!location.is_active ? "opacity-50" : ""}>
                                        <TableCell className="font-medium">
                                            {location.name}
                                            {location.description && <p className="text-xs text-muted-foreground">{location.description}</p>}
                                        </TableCell>
                                        <TableCell className="capitalize">{location.location_type}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={location.is_active}
                                                    onCheckedChange={() => toggleActive(location)}
                                                />
                                                <span className="text-xs text-muted-foreground">
                                                    {location.is_active ? "Active" : "Archived"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(location)}>
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
                        <DialogTitle>{editingLocation ? "Edit Location" : "Add Location"}</DialogTitle>
                        <DialogDescription>
                            Configure the details for this inventory location.
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
                                placeholder="e.g. Main Bar"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="type" className="text-right">Type</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bar">Bar</SelectItem>
                                    <SelectItem value="cellar">Cellar</SelectItem>
                                    <SelectItem value="kitchen">Kitchen</SelectItem>
                                    <SelectItem value="store">Store Room</SelectItem>
                                    <SelectItem value="office">Office</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">Description</Label>
                            <Input
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="col-span-3"
                                placeholder="Optional details..."
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
