'use client';

import { useState } from 'react';
import { api } from '@/trpc/react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CustomerForm } from './CustomerForm';
import { PlusCircle } from 'lucide-react';
import { inferRouterOutputs } from '@trpc/server';
import { AppRouter } from '@/server/api/root';

type RouterOutput = inferRouterOutputs<AppRouter>;
type CustomerWithCount = RouterOutput['customers']['list'][number];

export default function CustomersPage() {
  const params = useParams();
  const workshopId = params.workshopId as string;
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const utils = api.useUtils();
  const { data: customers, isLoading } = api.customers.list.useQuery({ workshopId });
  const createCustomer = api.customers.create.useMutation({
    onSuccess: () => {
      utils.customers.list.invalidate({ workshopId });
      setIsDialogOpen(false);
    },
  });

  if (isLoading) return <div>Loading customers...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Customers</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Customer</DialogTitle>
            </DialogHeader>
            <CustomerForm
              isLoading={createCustomer.isPending}
              onSubmit={(values) => {
                createCustomer.mutate({ workshopId, ...values });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Orders</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers?.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell>{customer._count.orders}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}