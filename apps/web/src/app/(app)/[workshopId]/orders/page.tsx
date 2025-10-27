'use client';

import { useState } from 'react';
import { api } from '@/trpc/react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle, KanbanSquare } from 'lucide-react';
import { type OrderListOutput } from '@/server/api/routers/orders';
import { OrderForm } from './OrderForm';
import { WorkflowStageChanger } from '@/components/shared/WorkflowStageChanger';
import Link from 'next/link';

type OrderInList = OrderListOutput[number];

export default function OrdersPage() {
  const params = useParams();
  const workshopId = params.workshopId as string;
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);

  const utils = api.useUtils();
  const { data: orders, isLoading: isLoadingOrders } = api.orders.list.useQuery({ workshopId });
  const { data: customers, isLoading: isLoadingCustomers } = api.customers.list.useQuery({ workshopId });
  const { data: products, isLoading: isLoadingProducts } = api.products.list.useQuery({ workshopId });

  const createOrder = api.orders.create.useMutation({
    onSuccess: () => {
      utils.orders.list.invalidate({ workshopId });
      setCreateDialogOpen(false);
    },
    onError: (error) => alert(`Error creating order: ${error.message}`),
  });

  if (isLoadingOrders || isLoadingCustomers || isLoadingProducts) {
    return <div>Loading page data...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Orders</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/${workshopId}/orders/workbench`}>
              <KanbanSquare className="mr-2 h-4 w-4" /> Workbench View
            </Link>
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" />Create Order</Button></DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader><DialogTitle>Create New Order</DialogTitle></DialogHeader>
              <OrderForm
                customers={customers}
                products={products}
                isLoading={createOrder.isPending}
                onSubmit={(values) => createOrder.mutate({ workshopId, ...values })}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Stage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders?.map((order: OrderInList) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">
                  <Link href={`/${workshopId}/orders/${order.id}`} className="underline hover:text-primary">
                    {order.orderNumber}
                  </Link>
                </TableCell>
                <TableCell>{order.customer.name}</TableCell>
                <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>${order.totalPrice.toFixed(2)}</TableCell>
                <TableCell>
                  <WorkflowStageChanger order={order} workshopId={workshopId} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}