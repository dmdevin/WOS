'use client';

import { useParams, useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/trpc/react';
import { createProductSchema } from '@/lib/validators';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2 } from 'lucide-react';

type CreateProductFormValues = z.infer<typeof createProductSchema>;

export default function NewProductPage() {
  const params = useParams();
  const router = useRouter();
  const workshopId = params.workshopId as string;
  const utils = api.useUtils();

  const { data: materials } = api.materials.list.useQuery({ workshopId });
  const { data: operations } = api.operations.list.useQuery({ workshopId });
  const { data: patterns } = api.patterns.list.useQuery({ workshopId });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateProductFormValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: '',
      sku: '',
      description: '',
      patternId: '',
      sellingPrice: 0,
      version: {
        estimatedLaborMinutes: 0,
        bomItems: [{ materialId: '', quantity: 1, scrapFactor: 0.05 }],
        routing: [{ operationId: '', estimatedTimeMin: 10, stepNumber: 1 }],
      },
    },
  });

  const { fields: bomFields, append: appendBom, remove: removeBom } = useFieldArray({ control, name: 'version.bomItems' });
  const { fields: routeFields, append: appendRoute, remove: removeRoute } = useFieldArray({ control, name: 'version.routing' });

  const createProduct = api.products.create.useMutation({
    onSuccess: (data) => {
      utils.products.list.invalidate({ workshopId });
      router.push(`/${workshopId}/products/${data.id}`);
    },
    onError: (error) => {
      alert(`Error creating product: ${error.message}`);
    },
  });

  const onSubmit = (data: CreateProductFormValues) => {
    if (data.patternId === '') {
      delete data.patternId;
    }
    createProduct.mutate({ workshopId, ...data });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Create New Product</h1>
        <Button type="submit" disabled={createProduct.isPending}>
          {createProduct.isPending ? 'Saving...' : 'Save Product'}
        </Button>
      </div>

      {/* Basic Product Info */}
      <div className="space-y-4 max-w-lg">
        <div>
          <Label htmlFor="name">Product Name</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="patternId">Pattern (Optional)</Label>
          <Controller
            control={control}
            name="patternId"
            render={({ field }) => (
              <select {...field} className="w-full border p-2 rounded-md h-10">
                <option value="">None</option>
                {patterns?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <Label htmlFor="sellingPrice">Selling Price</Label>
                <Input id="sellingPrice" type="number" step="0.01" {...register('sellingPrice')} />
                {errors.sellingPrice && <p className="text-sm text-destructive">{errors.sellingPrice.message}</p>}
            </div>
            <div>
                <Label htmlFor="estimatedLaborMinutes">Total Estimated Labor (Minutes)</Label>
                <Input id="estimatedLaborMinutes" type="number" {...register('version.estimatedLaborMinutes')} />
                {errors.version?.estimatedLaborMinutes && <p className="text-sm text-destructive">{errors.version.estimatedLaborMinutes.message}</p>}
            </div>
        </div>
        <div>
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" {...register('sku')} />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register('description')} />
        </div>
      </div>

      {/* Bill of Materials */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Bill of Materials</h2>
        <div className="space-y-2">
          {bomFields.map((field, index) => (
            <div key={field.id}>
              <div className="flex items-center gap-2">
                <Controller
                  control={control}
                  name={`version.bomItems.${index}.materialId`}
                  render={({ field }) => (
                    <select {...field} className="border p-2 rounded-md w-1/2 h-10">
                      <option value="">Select Material</option>
                      {materials?.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  )}
                />
                <Input type="number" step="0.01" {...register(`version.bomItems.${index}.quantity`)} placeholder="Qty" className="w-24"/>
                <Button type="button" variant="outline" size="sm" onClick={() => removeBom(index)}><Trash2 className="h-4 w-4"/></Button>
              </div>
              {/* --- THE FIX: Display validation errors for the material dropdown --- */}
              {errors.version?.bomItems?.[index]?.materialId && <p className="text-sm text-destructive pl-1 pt-1">{errors.version.bomItems[index]?.materialId?.message}</p>}
            </div>
          ))}
          <Button type="button" variant="secondary" size="sm" onClick={() => appendBom({ materialId: '', quantity: 1, scrapFactor: 0.05 })}>
            <PlusCircle className="mr-2 h-4 w-4"/> Add Material
          </Button>
          {errors.version?.bomItems && <p className="text-sm text-destructive mt-2">{errors.version.bomItems.message}</p>}
        </div>
      </div>
      
      {/* Routing */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Routing (Steps)</h2>
        <div className="space-y-2">
          {routeFields.map((field, index) => (
            <div key={field.id}>
               <div className="flex items-center gap-2">
                <Input type="hidden" {...register(`version.routing.${index}.stepNumber`, { value: index + 1 })} />
                <Controller
                  control={control}
                  name={`version.routing.${index}.operationId`}
                  render={({ field }) => (
                    <select {...field} className="border p-2 rounded-md w-1/2 h-10">
                      <option value="">Select Operation</option>
                      {operations?.map((op) => <option key={op.id} value={op.id}>{op.name}</option>)}
                    </select>
                  )}
                />
                <Input type="number" {...register(`version.routing.${index}.estimatedTimeMin`)} placeholder="Time (min)" className="w-32"/>
                <Button type="button" variant="outline" size="sm" onClick={() => removeRoute(index)}><Trash2 className="h-4 w-4"/></Button>
               </div>
              {/* --- THE FIX: Display validation errors for the operation dropdown --- */}
              {errors.version?.routing?.[index]?.operationId && <p className="text-sm text-destructive pl-1 pt-1">{errors.version.routing[index]?.operationId?.message}</p>}
            </div>
          ))}
          <Button type="button" variant="secondary" size="sm" onClick={() => appendRoute({ operationId: '', estimatedTimeMin: 10, stepNumber: routeFields.length + 1 })}>
            <PlusCircle className="mr-2 h-4 w-4"/> Add Step
          </Button>
          {errors.version?.routing && <p className="text-sm text-destructive mt-2">{errors.version.routing.message}</p>}
        </div>
      </div>
    </form>
  );
}