'use client';

import { useState } from 'react';
import { api } from '@/trpc/react';
import { useParams } from 'next/navigation';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type OrderListOutput } from '@/server/api/routers/orders';

type OrderInList = OrderListOutput[number];
type WorkflowStage = "PENDING" | "CUTTING" | "SKIVING" | "STITCHING" | "FINISHING" | "PACKING" | "SHIPPED";

const stages: WorkflowStage[] = ["PENDING", "CUTTING", "SKIVING", "STITCHING", "FINISHING", "PACKING", "SHIPPED"];

// Individual Order Card Component
function OrderCard({ order }: { order: OrderInList }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: order.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="mb-2">
        <CardHeader className="p-3">
          <CardTitle className="text-sm font-medium">{order.orderNumber}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 text-xs text-muted-foreground">
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
    onError: (error) => alert(`Error updating stage: ${error.message}`),
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const activeOrderId = active.id as string;
      const newStage = over.id as WorkflowStage;
      updateStage.mutate({ workshopId, orderId: activeOrderId, stage: newStage });
    }
  }

  if (isLoading) return <div>Loading workbench...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Production Workbench</h1>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 items-start">
          {stages.map(stage => (
            <div key={stage} className="bg-gray-100 p-2 rounded-lg">
              <h2 className="font-bold p-2 text-sm uppercase text-gray-500">{stage}</h2>
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