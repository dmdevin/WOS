'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/trpc/react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useEffect } from 'react';
import { updateSettingsSchema } from '@/lib/validators';

type SettingsFormValues = z.infer<typeof updateSettingsSchema>;

export default function SettingsPage() {
  const params = useParams();
  const workshopId = params.workshopId as string;
  const utils = api.useUtils();

  const { data: settings, isLoading } = api.settings.get.useQuery({ workshopId });

  const updateSettings = api.settings.update.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate({ workshopId });
      // You might want to add a success toast notification here in the future
    },
    onError: (error) => {
      alert(`Error saving settings: ${error.message}`);
    }
  });

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(updateSettingsSchema),
    defaultValues: {
      laborRate: 0,
      overheadRate: 0,
      currency: 'USD',
    }
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        laborRate: settings.laborRate,
        // THE FIX: Add the new overheadRate to the form state
        overheadRate: settings.overheadRate,
        currency: settings.currency,
      });
    }
  }, [settings, form]);

  const onSubmit = (values: SettingsFormValues) => {
    updateSettings.mutate({ workshopId, ...values });
  };

  if (isLoading) return <div>Loading settings...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Workshop Configuration</CardTitle>
          <CardDescription>
            These settings affect cost calculations across all your products.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-sm">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="laborRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Labor Rate ($/hour)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* --- THE FIX: ADD THE NEW FORM FIELD FOR OVERHEAD RATE --- */}
                <FormField
                  control={form.control}
                  name="overheadRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overhead Rate (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="1" placeholder="e.g., 15" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <Input placeholder="USD" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={updateSettings.isPending}>
                {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}