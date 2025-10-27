'use client';

import { useParams, useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { PatternForm } from '../PatternForm';

export default function CreatePatternPage() {
  const params = useParams();
  const router = useRouter();
  const workshopId = params.workshopId as string;
  const utils = api.useUtils();

  const createPattern = api.patterns.create.useMutation({
    onSuccess: () => {
      utils.patterns.list.invalidate({ workshopId });
      router.push(`/${workshopId}/patterns`);
    },
    onError: (error) => alert(`Error creating pattern: ${error.message}`),
  });

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Add New Pattern</h1>
      <PatternForm
        type="create" // Pass the type
        isLoading={createPattern.isPending}
        onSubmit={(values) => {
          createPattern.mutate({ workshopId, ...values });
        }}
      />
    </div>
  );
}