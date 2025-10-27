'use client';

import { api } from '@/trpc/react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { WorkflowStageChanger } from '@/components/shared/WorkflowStageChanger';
import { type OrderByIdOutput } from '@/server/api/routers/orders';

type OrderDetail = OrderByIdOutput;
type OrderItemDetail = OrderDetail['orderItems'][number];

export default function OrderDetailPage() {
  const params = useParams();
  const workshopId = params.workshopId as string;
  const orderId = params.orderId as string;

  const { data: order, isLoading } = api.orders.getById.useQuery(
    { workshopId, id: orderId },
    { enabled: !!orderId }
  );

  if (isLoading) return <div>Loading order details...</div>;
  if (!order) return <div>Order not found.</div>;

  return (
    <div>
      <Button variant="ghost" asChild className="mb-4">
        <Link href={`/${workshopId}/orders`}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
        </Link>
      </Button>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle>Order Items</CardTitle></CardHeader>
            <CardContent>
              <ul className="divide-y">
                {order.orderItems.map((item: OrderItemDetail) => (
                  <li key={item.id} className="py-2 flex justify-between">
                    <span>{item.productVersion.product.name} (x{item.quantity})</span>
                    {/* The API now returns a number, so we can call .toFixed() safely */}
                    <span className="font-mono">${item.unitPrice.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Order Details</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Order #:</strong> {order.orderNumber}</p>
              <p><strong>Customer:</strong> {order.customer.name}</p>
              <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
              <p><strong>Total:</strong> ${order.totalPrice.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Production Stage</CardTitle></CardHeader>
            <CardContent>
              {/* --- THE FIX: The 'order' object now correctly matches the expected props --- */}
              <WorkflowStageChanger order={order} workshopId={workshopId} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}