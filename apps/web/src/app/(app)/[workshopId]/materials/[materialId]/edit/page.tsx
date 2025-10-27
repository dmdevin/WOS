'use client';

import { useParams, useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { MaterialForm } from '../../MaterialForm';
import { z } from 'zod';
import { createMaterialSchema } from '@/lib/validators';

export default function EditMaterialPage() {
  const params = useParams();
  const router = useRouter();
  const workshopId = params.workshopId as string;
  const materialId = params.materialId as string;
  const utils = api.useUtils();

  const { data: material, isLoading: isLoadingMaterial } = api.materials.getById.useQuery(
    { workshopId, id: materialId },
    { enabled: !!materialId }
  );

  const updateMaterial = api.materials.update.useMutation({
    onSuccess: () => {
      utils.materials.list.invalidate({ workshopId });
      router.push(`/${workshopId}/materials`);
    },
    onError: (error) => alert(`Error updating material: ${error.message}`),
  });
  
  if (isLoadingMaterial) return <div>Loading material...</div>;
  if (!material) return <div>Material not found.</div>;
  
  // --- THE FIX: Transform the database object to match the form's expected shape. ---
  // We convert any `null` values for optional fields into `undefined`.
  const defaultValues = {
    ...material,
    supplierName: material.supplierName ?? undefined,
    supplierUrl: material.supplierUrl ?? undefined,
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Material: {material.name}</h1>
      <MaterialForm 
        isLoading={updateMaterial.isPending}
        defaultValues={defaultValues}
        onSubmit={(values: z.infer<typeof createMaterialSchema>) => {
          updateMaterial.mutate({ id: materialId, workshopId, ...values });
        }}
      />
    </div>
  );
}