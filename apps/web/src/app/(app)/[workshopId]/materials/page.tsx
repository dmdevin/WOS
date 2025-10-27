'use client';

import { useState } from 'react';
import { api } from '@/trpc/react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle, AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import { MaterialForm } from './MaterialForm';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
// THE FIX: Import the explicit server-side type
import { type MaterialListOutput } from '@/server/api/routers/materials';

// THE FIX: Define the component's type from the imported server type
type MaterialInList = MaterialListOutput[number];

export default function MaterialsPage() {
  const params = useParams();
  const workshopId = params.workshopId as string;
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);

  const utils = api.useUtils();
  const { data: materials, isLoading } = api.materials.list.useQuery({ workshopId });

  const createMaterial = api.materials.create.useMutation({
    onSuccess: () => {
      utils.materials.list.invalidate({ workshopId });
      setCreateDialogOpen(false);
    },
    onError: (error) => alert(`Error creating material: ${error.message}`),
  });

  if (isLoading) return <div>Loading materials...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Materials & Inventory</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Material
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Create New Material</DialogTitle></DialogHeader>
            <MaterialForm
              isLoading={createMaterial.isPending}
              onSubmit={(values) => createMaterial.mutate({ workshopId, ...values })}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Stock Level</TableHead>
              <TableHead>Unit Cost</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* THE FIX: Explicitly type the 'material' parameter */}
            {materials?.map((material: MaterialInList) => (
              <TableRow key={material.id}>
                <TableCell className="font-medium">{material.name}</TableCell>
                <TableCell>{material.category}</TableCell>
                <TableCell className="flex items-center gap-2">
                  {material.stockLevel} {material.unitOfMeasure}
                  {material.stockLevel < material.stockAlertThreshold && (
                    <Badge variant="destructive" className="flex gap-1 items-center">
                      <AlertTriangle className="h-3 w-3" /> Low
                    </Badge>
                  )}
                </TableCell>
                {/* Prisma's Decimal is serialized as a string, so we cast to `any` for `toFixed` */}
                <TableCell>${(material.unitCost as any).toFixed(2)}</TableCell>
                <TableCell>
                  {material.supplierUrl ? (
                    <a href={material.supplierUrl} target="_blank" rel="noopener noreferrer" className="underline">
                      {material.supplierName || 'Link'}
                    </a>
                  ) : (
                    material.supplierName
                  )}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/${workshopId}/materials/${material.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}