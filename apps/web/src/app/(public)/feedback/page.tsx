'use client';

import { api } from '@/trpc/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFeedbackSchema } from '@/lib/validators';
import type { z } from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp } from 'lucide-react';
import { useSession } from 'next-auth/react';

type CreateFeedbackFormValues = z.infer<typeof createFeedbackSchema>;

export default function FeedbackPage() {
  const { data: session } = useSession(); // Check if the user is logged in
  const utils = api.useUtils();
  const { data: feedbackPosts, isLoading } = api.feedback.list.useQuery();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateFeedbackFormValues>({
    resolver: zodResolver(createFeedbackSchema),
  });

  const createFeedback = api.feedback.create.useMutation({
    onSuccess: () => {
      utils.feedback.list.invalidate();
      reset(); // Clear the form
    },
    onError: (error) => alert(`Error: ${error.message}`),
  });

  const toggleUpvote = api.feedback.toggleUpvote.useMutation({
    onSuccess: () => {
      utils.feedback.list.invalidate();
    },
  });

  const onSubmit = (data: CreateFeedbackFormValues) => {
    createFeedback.mutate(data);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Feedback Submission Form */}
      <div className="md:col-span-1">
        <h2 className="text-2xl font-bold mb-4">Submit Feedback</h2>
        {session ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="title">Title / Summary</Label>
              <Input id="title" {...register('title')} />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <select id="category" {...register('category')} className="w-full border p-2 rounded-md h-10">
                <option value="FEATURE_REQUEST">Feature Request</option>
                <option value="BUG_REPORT">Bug Report</option>
                <option value="GENERAL">General Feedback</option>
              </select>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register('description')} rows={5} />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>
            <Button type="submit" disabled={createFeedback.isPending}>
              {createFeedback.isPending ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </form>
        ) : (
          <p className="text-muted-foreground">You must be logged in to submit feedback.</p>
        )}
      </div>

      {/* Feedback Board */}
      <div className="md:col-span-2">
        <h2 className="text-2xl font-bold mb-4">Feedback Board</h2>
        {isLoading ? (
          <p>Loading feedback...</p>
        ) : (
          <div className="space-y-4">
            {feedbackPosts?.map(post => (
              <Card key={post.id}>
                <CardHeader>
                  <CardTitle>{post.title}</CardTitle>
                  <CardDescription>
                    Submitted by {post.createdBy?.name || 'a user'} on {new Date(post.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>{post.description}</p>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={!session || toggleUpvote.isPending}
                    onClick={() => toggleUpvote.mutate({ feedbackId: post.id })}
                  >
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    Upvote ({post._count.upvotes})
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}