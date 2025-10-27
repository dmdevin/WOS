import { createTRPCRouter } from '@/server/api/trpc';
import { userRouter } from './routers/user';
import { workshopsRouter } from './routers/workshops';
import { materialsRouter } from './routers/materials';
import { productsRouter } from './routers/products';
import { customersRouter } from './routers/customers';
import { ordersRouter } from './routers/orders';
// import { workOrdersRouter } from './routers/workOrders'; // <-- DELETE THIS LINE
import { analyticsRouter } from './routers/analytics';
import { settingsRouter } from './routers/settings';
import { operationsRouter } from './routers/operations';
import { patternsRouter } from './routers/patterns';
import { feedbackRouter } from './routers/feedback'; // <-- IMPORT

export const appRouter = createTRPCRouter({
  user: userRouter,
  workshops: workshopsRouter,
  feedback: feedbackRouter, // <-- ADD

  materials: materialsRouter,
  products: productsRouter,
  customers: customersRouter,
  orders: ordersRouter,
  // workOrders: workOrdersRouter, // <-- DELETE THIS LINE
  analytics: analyticsRouter,
  settings: settingsRouter,
  operations: operationsRouter,
  patterns: patternsRouter,
});

export type AppRouter = typeof appRouter;