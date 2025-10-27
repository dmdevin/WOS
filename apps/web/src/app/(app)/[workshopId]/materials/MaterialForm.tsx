'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { createMaterialSchema } from '@/lib/validators';
import { z } from 'zod';

// THE FIX: Define the categories as a client-side constant array.
// This removes the need to import from '@prisma/client'.
const materialCategories = [
  "LEATHER",
  "THREAD",
  "HARDWARE",
  "PACKAGING",
  "TOOLS",
  "CONSUMABLE",
  "OTHER"
] as const;

// Infer the type for the form values from the Zod schema
type MaterialFormValues = z.infer<typeof createMaterialSchema>;

interface MaterialFormProps {
  onSubmit: (values: MaterialFormValues) => void;
  isLoading: boolean;
  defaultValues?: Partial<MaterialFormValues>;
}

export function MaterialForm({ onSubmit, isLoading, defaultValues }: MaterialFormProps) {
  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(createMaterialSchema),
    defaultValues: defaultValues || {
      name: '',
      category: "OTHER", // Default to a valid category
      unitOfMeasure: '',
      stockLevel: 0,
      stockAlertThreshold: 0,
      unitCost: 0,
      supplierName: '',
      supplierUrl: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Material Name</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <select {...field} className="w-full border p-2 rounded-md h-10">
                  {/* Map over the client-side array */}
                  {materialCategories.map((category) => (<option key={category} value={category}>{category}</option>))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}/>
          <FormField control={form.control} name="unitOfMeasure" render={({ field }) => (
            <FormItem>
              <FormLabel>Unit of Measure</FormLabel>
              <FormControl><Input placeholder="e.g., sqft, item, oz" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}/>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FormField control={form.control} name="stockLevel" render={({ field }) => (
            <FormItem>
              <FormLabel>Stock Level</FormLabel>
              <FormControl><Input type="number" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}/>
          <FormField control={form.control} name="stockAlertThreshold" render={({ field }) => (
            <FormItem>
              <FormLabel>Alert Threshold</FormLabel>
              <FormControl><Input type="number" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}/>
          <FormField control={form.control} name="unitCost" render={({ field }) => (
            <FormItem>
              <FormLabel>Unit Cost ($)</FormLabel>
              <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}/>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="supplierName" render={({ field }) => (
            <FormItem>
              <FormLabel>Supplier Name (Optional)</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}/>
          <FormField control={form.control} name="supplierUrl" render={({ field }) => (
            <FormItem>
              <FormLabel>Supplier URL (Optional)</FormLabel>
              <FormControl><Input type="url" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}/>
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Material'}
        </Button>
      </form>
    </Form>
  );
}