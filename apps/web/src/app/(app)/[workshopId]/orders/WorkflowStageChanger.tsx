'use client';

import { api } from '@/trpc/react';
import { Badge } from '@/components/ui/badge';
import { type OrderListOutput } from '@/server/api/routers/orders';

type OrderInList = OrderListOutput[number];
type WorkflowStage = "PENDING" | "CUTTING" | "SKIVING" | "STITCHING" | "FINISHING" | "PACKING" | "SHIPPED";

const stages: WorkflowStage[] = ["PENDING", "CUTTING", "SKIVING", "STITCHING", "FINISHING", "PACKING", "SHIPPED"];

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

const stageColors: { [key: string]: BadgeVariant } = {
  PENDING: 'secondary',
  CUTTING: 'default',
  STITCHING: 'default',
  FINISHING: 'default',
  PACKING: 'outline',
  SHIPPED: 'destructive',
};

interface WorkflowStageChangerProps {
  order: OrderInList;
  workshopId: string;
}

export function WorkflowStageChanger({ order, workshopId }: WorkflowStageChangerProps) {
  const utils = api.useUtils();
  
  const updateStage = api.orders.updateStage.useMutation({
    onSuccess: () => {
      utils.orders.list.invalidate({ workshopId });
      utils.orders.getById.invalidate({ workshopId, id: order.id });
    },
    onError: (error) => {
      alert(`Error updating stage: ${error.message}`);
    },
  });

  const handleStageChange = (newStage: WorkflowStage) => {
    updateStage.mutate({ workshopId, orderId: order.id, stage: newStage });
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={order.workflowStage}
        onChange={(e) => handleStageChange(e.target.value as WorkflowStage)}
        disabled={updateStage.isPending}
        className="border p-1 rounded-md text-sm bg-transparent"
      >
        {stages.map(stage => (
          <option key={stage} value={stage}>{stage}</option>
        ))}
      </select>
      <Badge variant={stageColors[order.workflowStage] || 'default'}>
        {order.workflowStage}
      </Badge>
    </div>
  );
}