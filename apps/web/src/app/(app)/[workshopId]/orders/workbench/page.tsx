'use client';

import { useState } from 'react';
import { api } from '@/trpc/react';
import { useParams } from 'next/navigation';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type OrderListOutput } from '@/server/api/routers/orders';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

type OrderInList = OrderListOutput[number];
type WorkflowStage = "PENDING" | "CUTTING" | "SKIVING" | "STITCHING" | "FINISHING" | "PACKING" | "SHIPPED";

const stages: WorkflowStage[] = ["PENDING", "CUTTING", "SKIVING", "STITCHING", "FINISHING", "PACKING", "SHIPPED"];

// Individual Order Card Component
function OrderCard({ order }: { order: OrderInList }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: order.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="mb-2 cursor-grab active:cursor-grabbing">
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-sm font-medium">{order.orderNumber}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-1 text-xs text-muted-foreground">
          <p>{order.customer.name}</p>
          <p>{order.orderItems.length} item(s)</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function WorkbenchPage() {
  const params = useParams();
  const workshopId = params.workshopId as string;
  const utils = api.useUtils();

  const { data: orders, isLoading } = api.orders.list.useQuery({ workshopId });

  const updateStage = api.orders.updateStage.useMutation({
    onSuccess: () => {
      utils.orders.list.invalidate({ workshopId });
    },
    onError: (error) => {
      alert(`Error updating stage: ${error.message}`);
    },
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const newStage = over?.data?.current?.sortable?.containerId as WorkflowStage | undefined;
    const activeOrderId = active.id as string;

    if (newStage && activeOrderId) {
      const originalOrder = orders?.find(o => o.id === activeOrderId);
      if (originalOrder && originalOrder.workflowStage !== newStage) {
        utils.orders.list.setData({ workshopId }, (oldData) => {
          if (!oldData) return [];
          const orderIndex = oldData.findIndex(o => o.id === activeOrderId);
          if (orderIndex === -1) return oldData;
          
          const updatedOrder = { ...oldData[orderIndex], workflowStage: newStage };
          const newData = [...oldData];
newData[orderIndex] = updatedOrder;
          
          return newData;
        });
        
        updateStage.mutate({ workshopId, orderId: activeOrderId, stage: newStage });
      }
    }
  }

  if (isLoading) return <div>Loading workbench...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Production Workbench</h1>
        {/* --- THE FIX: Add a 'Back to List' button --- */}
        <Button variant="outline" asChild>
          <Link href={`/${workshopId}/orders`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders List
          </Link>
        </Button>
      </div>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 items-start">
          {stages.map(stage => (
            <div key={stage} className="bg-gray-100 p-2 rounded-lg min-h-[10rem]">
              <h2 className="font-bold p-2 text-sm uppercase text-gray-500 tracking-wider">{stage}</h2>
              <SortableContext items={orders?.filter(o => o.workflowStage === stage).map(o => o.id) ?? []} id={stage} strategy={verticalListSortingStrategy}>
                {orders?.filter(o => o.workflowStage === stage).map(order => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </SortableContext>
            </div>
          ))}
        </div>
      </DndContext>
    </div>
  );
}