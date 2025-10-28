'use client';

// --- CHANGE 1: Import useState and useEffect ---
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/trpc/react';
// --- CHANGE 2: Import Image icon for better UI ---
import { FileText, Download, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type PatternByIdOutput } from '@/server/api/routers/patterns';

type PatternFile = PatternByIdOutput['files'][number];

export default function ViewPatternPage() {
  const params = useParams();
  const workshopId = params.workshopId as string;
  const patternId = params.patternId as string;
  
  const { data: pattern, isLoading } = api.patterns.getById.useQuery({ workshopId, id: patternId });

  // --- CHANGE 3: State to manage the currently displayed file ---
  // We'll store the entire file object in state. It's initialized to null.
  const [selectedFile, setSelectedFile] = useState<PatternFile | null>(null);

  // --- CHANGE 4: Effect to set the initial selected file ---
  // This runs when the `pattern` data is loaded. It sets the first file
  // as the default view, but only if one doesn't exist already.
  useEffect(() => {
    if (pattern && pattern.files.length > 0 && !selectedFile) {
      setSelectedFile(pattern.files[0]);
    }
  }, [pattern, selectedFile]);


  if (isLoading) return <div>Loading pattern...</div>;
  if (!pattern) return <div>Pattern not found.</div>;

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Main Preview Area */}
      <div className="flex-grow h-[calc(100vh-12rem)] w-full flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-4 truncate max-w-full">{pattern.name}</h1>
        
        {/* --- CHANGE 5: Display the selectedFile from state, not the hardcoded first file --- */}
        {selectedFile ? (
          selectedFile.fileType === 'image' ? (
            <img src={selectedFile.fileUrl} alt={pattern.name} className="max-h-full max-w-full object-contain"/>
          ) : (
            <embed src={selectedFile.fileUrl} type="application/pdf" className="h-full w-full"/>
          )
        ) : (
          // A helpful placeholder if there are no files
          <div className="h-full w-full flex items-center justify-center bg-muted rounded-md">
            <p className="text-muted-foreground">No files in this pattern.</p>
          </div>
        )}
      </div>

      {/* Sidebar with File List */}
      <div className="w-full md:w-80 flex-shrink-0">
        <h2 className="text-lg font-semibold">Details</h2>
        <p className="text-sm text-muted-foreground mt-2">{pattern.description || 'No description.'}</p>
        
        <h3 className="text-md font-semibold mt-4">Files ({pattern.files.length})</h3>
        <ul className="mt-2 space-y-2">
          {pattern.files.map((file: PatternFile) => (
            // --- CHANGE 6: Make the entire list item clickable to change the preview ---
            <li 
              key={file.id} 
              onClick={() => setSelectedFile(file)}
              className={`flex items-center justify-between text-sm p-2 border rounded-md cursor-pointer transition-colors hover:bg-muted/80 ${
                // Highlight the currently selected file
                selectedFile?.id === file.id ? 'bg-muted ring-2 ring-primary' : ''
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                {/* Use a different icon for images vs. PDFs */}
                {file.fileType === 'image' 
                  ? <ImageIcon className="h-4 w-4 flex-shrink-0 text-blue-500"/> 
                  : <FileText className="h-4 w-4 flex-shrink-0 text-red-500"/>
                }
                <span className="truncate">{file.fileName}</span>
              </div>
              <Button variant="ghost" size="icon" asChild>
                <a 
                  href={file.fileUrl} 
                  download={file.fileName}
                  // Prevent the click from bubbling up to the `li` onClick
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download className="h-4 w-4"/>
                </a>
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}