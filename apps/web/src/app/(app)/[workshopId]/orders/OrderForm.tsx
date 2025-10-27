'use client';

import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createOrderSchema } from '@/lib/validators';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { inferRouterOutputs } from '@trpc/server';
import { AppRouter } from '@/server/api/root';

type CreateOrderFormValues = z.infer<typeof createOrderSchema>;
type RouterOutput = inferRouterOutputs<AppRouter>;
type Customer = RouterOutput['customers']['list'][number];
type Product = RouterOutput['products']['list'][number];

interface OrderFormProps {
  customers: Customer[] | undefined;
  products: Product[] | undefined;
  onSubmit: (values: CreateOrderFormValues) => void;
  isLoading: boolean;
}

export function OrderForm({ customers, products, onSubmit, isLoading }: OrderFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateOrderFormValues>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      customerId: '',
      notes: '',
      items: [{ productVersionId: '', quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Customer and Notes */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="customerId">Customer</Label>
          <Controller
            control={control}
            name="customerId"
            render={({ field }) => (
              <select {...field} className="w-full border p-2 rounded-md">
                <option value="">Select a customer</option>
                {customers?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          />
          {errors.customerId && <p className="text-red-500 text-sm">{errors.customerId.message}</p>}
        </div>
        <div>
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea id="notes" {...register('notes')} />
        </div>
      </div>

      {/* Order Items */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Order Items</h3>
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-2">
              <div className="flex-grow space-y-2">
                <Controller
                  control={control}
                  name={`items.${index}.productVersionId`}
                  render={({ field }) => (
                    <select {...field} className="w-full border p-2 rounded-md">
                      <option value="">Select a product</option>
                      {products?.map((p) => (
                        p.versions[0] && <option key={p.versions[0].id} value={p.versions[0].id}>
                          {p.name} (v{p.versions[0].version})
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>
              <div className="w-24">
                <Label htmlFor={`items.${index}.quantity`} className="sr-only">Quantity</Label>
                <Input id={`items.${index}.quantity`} type="number" {...register(`items.${index}.quantity`)} placeholder="Qty"/>
              </div>
              <div className="w-28">
                <Label htmlFor={`items.${index}.unitPrice`} className="sr-only">Unit Price</Label>
                <Input id={`items.${index}.unitPrice`} type="number" step="0.01" {...register(`items.${index}.unitPrice`)} placeholder="Price"/>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => remove(index)} className="mt-1">
                <Trash2 className="h-4 w-4"/>
              </Button>
            </div>
          ))}
          <Button type="button" variant="secondary" size="sm" onClick={() => append({ productVersionId: '', quantity: 1, unitPrice: 0 })}>
            <PlusCircle className="mr-2 h-4 w-4"/> Add Item
          </Button>
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Creating Order...' : 'Create Order'}
      </Button>
    </form>
  );
}