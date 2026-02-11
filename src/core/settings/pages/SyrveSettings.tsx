import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { supabase } from "@/core/lib/supabase/client";
import { Button } from "@/core/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/core/ui/form";
import { Input } from "@/core/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/core/ui/select";
import { Separator } from "@/core/ui/separator";
import { useToast } from "@/core/ui/use-toast";
import { Badge } from "@/core/ui/badge";
import { Loader2, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

const syrveFormSchema = z.object({
    server_url: z.string().url("Must be a valid URL"),
    api_login: z.string().min(1, "Login is required"),
    api_password: z.string().min(1, "Password is required"),
    store_id: z.string().optional(),
    store_name: z.string().optional(),
});

type SyrveFormValues = z.infer<typeof syrveFormSchema>;

export default function SyrveSettings() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isTesting, setIsTesting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'success' | 'error'>('unknown');
    const [stores, setStores] = useState<Array<{ id: string; name: string }>>([]);
    const [lastSync, setLastSync] = useState<string | null>(null);

    const form = useForm<SyrveFormValues>({
        resolver: zodResolver(syrveFormSchema),
        defaultValues: {
            server_url: "",
            api_login: "",
            api_password: "",
            store_id: "",
            store_name: "",
        },
    });

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('syrve_config')
                .select('*')
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (data) {
                form.reset({
                    server_url: data.server_url || "",
                    api_login: data.api_login || "",
                    api_password: "", // Don't populate password for security
                    store_id: data.store_id || "",
                    store_name: data.store_name || "",
                });
                setLastSync(data.last_sync_at);
                setConnectionStatus(data.is_active ? 'success' : 'unknown');
            }
        } catch (error) {
            console.error('Error fetching Syrve config:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const testConnection = async () => {
        const values = form.getValues();
        if (!values.server_url || !values.api_login || !values.api_password) {
            toast({
                title: "Incomplete",
                description: "Please fill in all required fields first.",
                variant: "destructive",
            });
            return;
        }

        setIsTesting(true);
        setConnectionStatus('unknown');

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`${supabase.supabaseUrl}/functions/v1/syrve-connect-test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify(values),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setConnectionStatus('success');
                toast({
                    title: "Connection successful",
                    description: "Successfully connected to Syrve server.",
                });
                // Now fetch stores
                await fetchStores();
            } else {
                setConnectionStatus('error');
                toast({
                    title: "Connection failed",
                    description: result.error || "Could not connect to Syrve server.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            setConnectionStatus('error');
            toast({
                title: "Error",
                description: "Failed to test connection.",
                variant: "destructive",
            });
        } finally {
            setIsTesting(false);
        }
    };

    const fetchStores = async () => {
        const values = form.getValues();
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`${supabase.supabaseUrl}/functions/v1/syrve-get-stores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify(values),
            });

            const result = await response.json();
            if (response.ok && result.stores) {
                setStores(result.stores);
            }
        } catch (error) {
            console.error('Error fetching stores:', error);
        }
    };

    const onSubmit = async (values: SyrveFormValues) => {
        setIsSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`${supabase.supabaseUrl}/functions/v1/syrve-save-config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify(values),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                toast({
                    title: "Configuration saved",
                    description: "Syrve connection settings have been updated.",
                });
                await fetchConfig();
            } else {
                throw new Error(result.error || "Failed to save configuration");
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error.message || "Could not save configuration.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const triggerSync = async () => {
        setIsSyncing(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`${supabase.supabaseUrl}/functions/v1/syrve-product-sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
            });

            const result = await response.json();

            if (response.ok && result.success) {
                toast({
                    title: "Sync completed",
                    description: `Synced ${result.stats?.products || 0} products and ${result.stats?.categories || 0} categories.`,
                });
                await fetchConfig();
            } else {
                throw new Error(result.error || "Sync failed");
            }
        } catch (error) {
            toast({
                title: "Sync failed",
                description: error.message || "Could not sync products from Syrve.",
                variant: "destructive",
            });
        } finally {
            setIsSyncing(false);
        }
    };

    if (isLoading) {
        return <div className="p-8">Loading Syrve settings...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Syrve Integration</h3>
                <p className="text-sm text-muted-foreground">
                    Connect to your Syrve (iiko) POS system to sync products and inventory.
                </p>
            </div>
            <Separator />

            {/* Connection Status */}
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Connection Status:</span>
                {connectionStatus === 'success' && (
                    <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Connected
                    </Badge>
                )}
                {connectionStatus === 'error' && (
                    <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" /> Failed
                    </Badge>
                )}
                {connectionStatus === 'unknown' && (
                    <Badge variant="outline">Not tested</Badge>
                )}
                {lastSync && (
                    <span className="text-xs text-muted-foreground ml-4">
                        Last sync: {new Date(lastSync).toLocaleString()}
                    </span>
                )}
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="server_url"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Server URL</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://syrve-server.example.com" {...field} />
                                </FormControl>
                                <FormDescription>
                                    Full URL to your Syrve server instance.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="api_login"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>API Login</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="api_password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>API Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {stores.length > 0 && (
                        <FormField
                            control={form.control}
                            name="store_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Store</FormLabel>
                                    <Select onValueChange={(value) => {
                                        field.onChange(value);
                                        const store = stores.find(s => s.id === value);
                                        if (store) {
                                            form.setValue('store_name', store.name);
                                        }
                                    }} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a store" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {stores.map((store) => (
                                                <SelectItem key={store.id} value={store.id}>
                                                    {store.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Select which store/location to sync from Syrve.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={testConnection} disabled={isTesting}>
                            {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Test Connection
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Configuration
                        </Button>
                        {connectionStatus === 'success' && (
                            <Button type="button" variant="secondary" onClick={triggerSync} disabled={isSyncing} className="ml-auto">
                                {isSyncing ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                )}
                                Sync Products Now
                            </Button>
                        )}
                    </div>
                </form>
            </Form>
        </div>
    );
}
