'use client';

import { api } from '@/trpc/react';
import { Badge } from '@/components/ui/badge';
// We no longer need the specific OrderListOutput type here.

// Define the client-safe type for the stage
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

// --- THE FIX: Make the 'order' prop more generic ---
// It now accepts any object as long as it has an 'id' and 'workflowStage'.
interface WorkflowStageChangerProps {
  order: {
    id: string;
    workflowStage: WorkflowStage;
  };
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