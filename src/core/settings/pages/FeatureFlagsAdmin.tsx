
import React, { useEffect, useState } from "react";
import { supabase } from "@/core/lib/supabase/client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/core/ui/table";
import { Switch } from "@/core/ui/switch";
import { Badge } from "@/core/ui/badge";
import { Input } from "@/core/ui/input";
import { Search } from "lucide-react";

interface FeatureFlag {
    id: string;
    flag_key: string;
    display_name: string;
    description: string;
    category: string;
    is_enabled: boolean;
    phase: string;
}

export default function FeatureFlagsAdmin() {
    const [flags, setFlags] = useState<FeatureFlag[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchFlags();
    }, []);

    const fetchFlags = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from("feature_flags")
            .select("*")
            .order("category", { ascending: true })
            .order("flag_key", { ascending: true });

        if (error) {
            console.error("Error fetching feature flags:", error);
        } else {
            setFlags(data || []);
        }
        setIsLoading(false);
    };

    const toggleFlag = async (flag: FeatureFlag) => {
        const newVal = !flag.is_enabled;
        const { error } = await supabase
            .from("feature_flags")
            .update({ is_enabled: newVal })
            .eq("id", flag.id);

        if (!error) {
            setFlags(flags.map((f) => (f.id === flag.id ? { ...f, is_enabled: newVal } : f)));
        }
    };

    const filteredFlags = flags.filter(
        (f) =>
            f.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.flag_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Feature Flags</h1>
                    <p className="text-muted-foreground">
                        Manage system-wide feature toggles for progressive rollout.
                    </p>
                </div>
            </div>

            <div className="flex items-center py-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search flags..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Flag Name</TableHead>
                            <TableHead>Key</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Phase</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : filteredFlags.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No flags found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredFlags.map((flag) => (
                                <TableRow key={flag.id}>
                                    <TableCell>
                                        <div className="font-medium">{flag.display_name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {flag.description}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">
                                        {flag.flag_key}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                            {flag.category}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {flag.phase && (
                                            <Badge variant="secondary">Phase {flag.phase}</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={flag.is_enabled}
                                            onCheckedChange={() => toggleFlag(flag)}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
