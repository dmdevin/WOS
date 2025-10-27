'use client';

import { api } from '@/trpc/react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type WorkshopListOutput } from '@/server/api/routers/workshops';

type WorkshopInList = WorkshopListOutput[number];

export default function WorkshopsPage() {
  const router = useRouter();
  const { data: workshops, isLoading } = api.workshops.list.useQuery();

  const createWorkshop = api.workshops.create.useMutation({
    onSuccess: (data) => {
      // THE FIX: Use a template literal (backticks) for the URL string.
      router.push(`/${data.id}/dashboard`);
    }
  });

  const handleCreateWorkshop = () => {
    const name = prompt("Enter new workshop name:");
    if (name) {
      createWorkshop.mutate({ name });
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-4">
        <h1 className="text-3xl font-bold text-center">Select a Workshop</h1>
        {workshops?.map((ws: WorkshopInList) => (
          <Link href={`/${ws.id}/dashboard`} key={ws.id}>
            <Card className="hover:bg-gray-50 cursor-pointer">
              <CardHeader>
                <CardTitle>{ws.name}</CardTitle>
                <CardDescription>Click to enter</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
        <Button onClick={handleCreateWorkshop} className="w-full" disabled={createWorkshop.isPending}>
          {createWorkshop.isPending ? "Creating..." : "Create New Workshop"}
        </Button>
      </div>
    </div>
  );
}