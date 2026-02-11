
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import { useEffect, useState } from "react";
import { supabase } from "@/core/lib/supabase/client";

const profileFormSchema = z.object({
    business_name: z.string().min(2, {
        message: "Business name must be at least 2 characters.",
    }),
    currency: z.string({
        required_error: "Please select a currency.",
    }),
    timezone: z.string({
        required_error: "Please select a timezone.",
    }),
    language: z.string().default("en"),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Default values while loading
const defaultValues: Partial<ProfileFormValues> = {
    business_name: "",
    currency: "USD",
    timezone: "UTC",
    language: "en",
};

export default function BusinessSettings() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues,
        mode: "onChange",
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data, error } = await supabase
                    .from('business_profile')
                    .select('*')
                    .limit(1)
                    .single();

                if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
                    throw error;
                }

                if (data) {
                    form.reset({
                        business_name: data.business_name || "",
                        currency: data.currency || "USD",
                        timezone: data.timezone || "UTC",
                        language: data.language || "en",
                    });
                }
            } catch (error) {
                console.error('Error fetching business settings:', error);
                toast({
                    title: "Error loading settings",
                    description: "Could not load business profile.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [form, toast]);

    async function onSubmit(data: ProfileFormValues) {
        try {
            // Upsert: simplified since we only ever want one row for now
            // But strict RLS/schema might require an ID. Let's see if we have one.
            // For now, we'll try to insert/update based on existence.

            // First check if a row exists
            const { data: existing } = await supabase.from('business_profile').select('id').limit(1).single();

            let error;
            if (existing) {
                const res = await supabase
                    .from('business_profile')
                    .update(data)
                    .eq('id', existing.id);
                error = res.error;
            } else {
                const res = await supabase
                    .from('business_profile')
                    .insert([data]);
                error = res.error;
            }

            if (error) throw error;

            toast({
                title: "Settings updated",
                description: "Business profile details have been saved.",
            });
        } catch (error) {
            console.error('Error saving business settings:', error);
            toast({
                title: "Error saving settings",
                description: "Could not save changes. Please try again.",
                variant: "destructive",
            });
        }
    }

    if (isLoading) {
        return <div className="p-8">Loading settings...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Business Profile</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your business identity and regional preferences.
                </p>
            </div>
            <Separator />
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                        control={form.control}
                        name="business_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Business Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Acme Inc." {...field} />
                                </FormControl>
                                <FormDescription>
                                    This is the name that will be displayed in the header and reports.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField
                            control={form.control}
                            name="currency"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Currency</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select currency" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="USD">USD ($)</SelectItem>
                                            <SelectItem value="EUR">EUR (€)</SelectItem>
                                            <SelectItem value="GBP">GBP (£)</SelectItem>
                                            <SelectItem value="AUD">AUD ($)</SelectItem>
                                            <SelectItem value="CAD">CAD ($)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Primary currency for stock valuation.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="timezone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Timezone</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select timezone" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="UTC">UTC</SelectItem>
                                            <SelectItem value="America/New_York">Eastern Time (US)</SelectItem>
                                            <SelectItem value="America/Los_Angeles">Pacific Time (US)</SelectItem>
                                            <SelectItem value="Europe/London">London (UK)</SelectItem>
                                            <SelectItem value="Europe/Paris">Paris (EU)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Used for timestamps and reports.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <Button type="submit">Update profile</Button>
                </form>
            </Form>
        </div>
    );
}
