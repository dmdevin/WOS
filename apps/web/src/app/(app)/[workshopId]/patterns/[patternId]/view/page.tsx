'use client';

import { useParams } from 'next/navigation';
import { api } from '@/trpc/react';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
// THE FIX: Import the explicit server-side type
import { type PatternByIdOutput } from '@/server/api/routers/patterns';

// THE FIX: Define the component's type from the imported server type
type PatternFile = PatternByIdOutput['files'][number];

export default function ViewPatternPage() {
  const params = useParams();
  const workshopId = params.workshopId as string;
  const patternId = params.patternId as string;
  
  const { data: pattern, isLoading } = api.patterns.getById.useQuery({ workshopId, id: patternId });

  if (isLoading) return <div>Loading pattern...</div>;
  if (!pattern) return <div>Pattern not found.</div>;

  const mainFile = pattern.files[0];

  return (
    <div className="flex gap-8">
      <div className="flex-grow h-[calc(100vh-10rem)] w-full flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-4">{pattern.name}</h1>
        {mainFile && (
          mainFile.fileType === 'image' ? (
            <img src={mainFile.fileUrl} alt={pattern.name} className="max-h-full max-w-full object-contain"/>
          ) : (
            <embed src={mainFile.fileUrl} type="application/pdf" className="h-full w-full"/>
          )
        )}
      </div>
      <div className="w-64 flex-shrink-0">
        <h2 className="text-lg font-semibold">Details</h2>
        <p className="text-sm text-muted-foreground mt-2">{pattern.description}</p>
        <h3 className="text-md font-semibold mt-4">Files ({pattern.files.length})</h3>
        <ul className="mt-2 space-y-2">
          {/* THE FIX: Explicitly type the 'file' parameter */}
          {pattern.files.map((file: PatternFile) => (
            <li key={file.id} className="flex items-center justify-between text-sm p-2 border rounded-md">
              <div className="flex items-center gap-2 truncate">
                <FileText className="h-4 w-4 flex-shrink-0"/>
                <span className="truncate">{file.fileName}</span>
              </div>
              <Button variant="ghost" size="icon" asChild>
                <a href={file.fileUrl} download={file.fileName}><Download className="h-4 w-4"/></a>
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}