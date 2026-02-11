import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/core/ui/select";
import { Label } from "@/core/ui/label";
import { Textarea } from "@/core/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/core/ui/radio-group";
import { useToast } from "@/core/ui/use-toast";
import { Loader2 } from "lucide-react";

export default function SessionSetup() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { toast } = useToast();

    const [sessionType, setSessionType] = useState<'full' | 'partial' | 'spot_check'>('full');
    const [locationId, setLocationId] = useState<string>('');
    const [notes, setNotes] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Fetch locations
    const { data: locations } = useQuery({
        queryKey: ['locations'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('locations')
                .select('*')
                .eq('is_active', true)
                .order('sort_order', { ascending: true });

            if (error) throw error;
            return data;
        },
    });

    const handleCreateSession = async () => {
        if (!locationId) {
            toast({
                title: "Location required",
                description: "Please select a location",
                variant: "destructive",
            });
            return;
        }

        setIsCreating(true);
        try {
            // Create session
            const { data: session, error: sessionError } = await supabase
                .from('inventory_sessions')
                .insert([{
                    session_type: sessionType,
                    status: 'draft',
                    started_by: user?.id,
                    location_id: locationId,
                    notes,
                }])
                .select()
                .single();

            if (sessionError) throw sessionError;

            // Add current user as participant
            const { error: participantError } = await supabase
                .from('session_participants')
                .insert([{
                    session_id: session.id,
                    user_id: user?.id,
                }]);

            if (participantError) throw participantError;

            toast({
                title: "Session created",
                description: "Ready to start counting",
            });

            // Navigate to counting interface
            navigate(`/inventory/session/${session.id}`);
        } catch (error) {
            console.error('Error creating session:', error);
            toast({
                title: "Error",
                description: "Failed to create session",
                variant: "destructive",
            });
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Start Inventory Count</h1>
                <p className="text-muted-foreground">
                    Set up a new counting session
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Session Setup</CardTitle>
                    <CardDescription>
                        Choose the type of count and location
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Session Type */}
                    <div className="space-y-3">
                        <Label>Session Type</Label>
                        <RadioGroup value={sessionType} onValueChange={(v) => setSessionType(v as any)}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="full" id="full" />
                                <Label htmlFor="full" className="font-normal cursor-pointer">
                                    Full Count - Count all products
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="partial" id="partial" />
                                <Label htmlFor="partial" className="font-normal cursor-pointer">
                                    Partial Count - Count specific categories
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="spot_check" id="spot_check" />
                                <Label htmlFor="spot_check" className="font-normal cursor-pointer">
                                    Spot Check - Quick verification
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Location */}
                    <div className="space-y-3">
                        <Label>Location</Label>
                        <Select value={locationId} onValueChange={setLocationId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent>
                                {locations?.map((location) => (
                                    <SelectItem key={location.id} value={location.id}>
                                        {location.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Notes */}
                    <div className="space-y-3">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Add any notes about this count..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <Button
                        onClick={handleCreateSession}
                        disabled={isCreating || !locationId}
                        className="w-full"
                        size="lg"
                    >
                        {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Start Counting
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
