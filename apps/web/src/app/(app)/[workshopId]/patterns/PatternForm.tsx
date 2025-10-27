'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPatternSchema, updatePatternSchema } from '@/lib/validators';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

// Use the create schema for the form's internal state
type PatternFormValues = z.infer<typeof createPatternSchema>;

interface PatternFormProps {
  onSubmit: (values: PatternFormValues) => void;
  isLoading: boolean;
  defaultValues?: Partial<Omit<PatternFormValues, 'files'>>;
  type: 'create' | 'edit';
}

export function PatternForm({ onSubmit, isLoading, defaultValues, type }: PatternFormProps) {
  // Choose the validation schema based on the 'type' prop.
  const schema = type === 'create' ? createPatternSchema : updatePatternSchema;

  const { register, handleSubmit, setValue, trigger, watch, formState: { errors } } = useForm<PatternFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || {},
  });

  // Watch the file input to display selected file names
  const selectedFileList = watch('files');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      // Clear the form value if no files are selected
      setValue('files', [], { shouldValidate: true });
      return;
    }

    // Convert the selected FileList into the format our schema expects (base64 strings)
    const filePromises = Array.from(files).map(file => {
      return new Promise<{ fileData: string; fileName: string }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ fileData: reader.result as string, fileName: file.name });
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    try {
      const fileDataArray = await Promise.all(filePromises);
      // THE FIX: Programmatically set the value for the 'files' field in the form state
      setValue('files', fileDataArray, { shouldValidate: true });
      // THE FIX: Manually trigger validation on the 'files' field to clear the error
      trigger('files');
    } catch (error) {
      console.error("Error reading files:", error);
      // Handle file reading error if necessary
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Pattern Name</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="files">Files (JPG, PNG, PDF) {type === 'edit' && "- Leave blank to add more"}</Label>
        {/* We use a standard file input and control it with our own handler */}
        <Input id="files" type="file" accept=".jpg,.jpeg,.png,.pdf" multiple onChange={handleFileChange} />
        {/* Display validation errors for the 'files' field */}
        {errors.files && <p className="text-sm text-destructive">{errors.files.message}</p>}
        
        {/* Display the names of the selected files */}
        {selectedFileList && selectedFileList.length > 0 && (
          <div className="mt-2 text-sm text-muted-foreground">
            {selectedFileList.length} file(s) selected: {selectedFileList.map(f => f.fileName).join(', ')}
          </div>
        )}
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register('description')} />
      </div>
      <div>
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input id="tags" {...register('tags')} />
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Pattern'}
      </Button>
    </form>
  );
}