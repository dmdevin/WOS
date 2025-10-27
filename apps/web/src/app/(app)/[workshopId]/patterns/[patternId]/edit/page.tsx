'use client';

import { useParams, useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { PatternForm } from '../../PatternForm';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
// THE FIX: Import the explicit server-side type
import { type PatternByIdOutput } from '@/server/api/routers/patterns';

// THE FIX: Define the component's type from the imported server type
type PatternFile = PatternByIdOutput['files'][number];

export default function EditPatternPage() {
  const params = useParams();
  const router = useRouter();
  const workshopId = params.workshopId as string;
  const patternId = params.patternId as string;
  const utils = api.useUtils();

  const { data: pattern, isLoading: isLoadingPattern } = api.patterns.getById.useQuery({ workshopId, id: patternId });

  const updatePattern = api.patterns.update.useMutation({
    onSuccess: () => {
      utils.patterns.list.invalidate({ workshopId });
      utils.patterns.getById.invalidate({ workshopId, id: patternId });
      router.push(`/${workshopId}/patterns`);
    },
    onError: (error) => alert(`Error updating pattern: ${error.message}`),
  });

  const deleteFile = api.patterns.deleteFile.useMutation({
    onSuccess: () => {
      utils.patterns.getById.invalidate({ workshopId, id: patternId });
    }
  });

  if (isLoadingPattern) return <div>Loading pattern...</div>;
  if (!pattern) return <div>Pattern not found.</div>;

  const formDefaultValues = {
    name: pattern.name,
    description: pattern.description ?? undefined,
    tags: pattern.tags ?? undefined,
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Pattern: {pattern.name}</h1>
      
      <div className="mb-6">
        <h3 className="text-md font-semibold mb-2">Existing Files</h3>
        <ul className="space-y-2">
          {/* THE FIX: Explicitly type the 'file' parameter */}
          {pattern.files.map((file: PatternFile) => (
            <li key={file.id} className="flex justify-between items-center p-2 border rounded-md">
              <span className="text-sm truncate">{file.fileName}</span>
              <Button variant="ghost" size="icon" onClick={() => deleteFile.mutate({ workshopId, fileId: file.id })}>
                <Trash2 className="h-4 w-4 text-red-500"/>
              </Button>
            </li>
          ))}
        </ul>
      </div>

      <PatternForm
        type="edit"
        isLoading={updatePattern.isPending}
        defaultValues={formDefaultValues}
        onSubmit={(values) => {
          updatePattern.mutate({ workshopId, id: patternId, ...values });
        }}
      />
    </div>
  );
}