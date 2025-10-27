'use client';

import { useState } from 'react';
import { api } from '@/trpc/react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, FileText, Trash2, Pencil, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { type PatternListOutput } from '@/server/api/routers/patterns';

type PatternInList = PatternListOutput[number];

export default function PatternsPage() {
  const params = useParams();
  const workshopId = params.workshopId as string;
  const [tagFilter, setTagFilter] = useState('');

  const utils = api.useUtils();
  const { data: patterns, isLoading } = api.patterns.list.useQuery({ workshopId });

  const deletePattern = api.patterns.delete.useMutation({
    onSuccess: () => {
      utils.patterns.list.invalidate({ workshopId });
    },
    onError: (error) => alert(`Error deleting pattern: ${error.message}`),
  });

  const filteredPatterns = patterns?.filter((p: PatternInList) => 
    tagFilter === '' || (p.tags && p.tags.toLowerCase().includes(tagFilter.toLowerCase()))
  );

  if (isLoading) return <div>Loading patterns...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Patterns</h1>
        <div className="flex gap-2 items-center">
          <Input 
            placeholder="Filter by tag..." 
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="w-48"
          />
          <Button asChild>
            <Link href={`/${workshopId}/patterns/create`}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Pattern
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredPatterns?.map((pattern) => {
          const firstFile = pattern.files[0];
          return (
            <Card key={pattern.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="truncate">{pattern.name}</CardTitle>
              </CardHeader>
              <CardContent className="h-48 flex items-center justify-center bg-gray-100 rounded-md flex-grow">
                <Link href={`/${workshopId}/patterns/${pattern.id}/view`} className="h-full w-full flex items-center justify-center">
                  {/* --- THE DEFINITIVE FIX: Replace <Image> with <img> --- */}
                  {firstFile?.fileType === 'image' ? (
                    <img 
                      src={firstFile.fileUrl} 
                      alt={pattern.name} 
                      className="object-contain h-full w-full"
                    />
                  ) : (
                    <FileText className="h-16 w-16 text-gray-400" />
                  )}
                </Link>
              </CardContent>
              <CardFooter className="flex justify-between items-center pt-4">
                <div className="text-sm text-muted-foreground truncate flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  <span>{pattern.files.filter(f => f.fileType === 'image').length}</span>
                  <FileText className="h-4 w-4" />
                  <span>{pattern.files.filter(f => f.fileType === 'pdf').length}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/${workshopId}/patterns/${pattern.id}/edit`}><Pencil className="h-4 w-4"/></Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-500"/></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the "{pattern.name}" pattern and all its associated files.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deletePattern.mutate({ workshopId, id: pattern.id })}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  );
}