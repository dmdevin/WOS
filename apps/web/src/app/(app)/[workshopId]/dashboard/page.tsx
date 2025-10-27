'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DollarSign, Package, AlertTriangle, TrendingUp, List } from 'lucide-react';
import { api } from '@/trpc/react';
import { useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@/server/api/root';

type KpiOutput = inferRouterOutputs<AppRouter>['analytics']['getKpis'];
type TopProductItem = KpiOutput['topProducts'][number];
type StockAlertItem = KpiOutput['stockAlertItems'][number];

export default function DashboardPage() {
  const params = useParams();
  const workshopId = params.workshopId as string;
  const { data: kpis, isLoading } = api.analytics.getKpis.useQuery({ workshopId });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${kpis?.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All-time revenue from confirmed orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders in Progress</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.ordersInProgress}</div>
            <p className="text-xs text-muted-foreground">Active work orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.stockAlertsCount} Items</div>
            <p className="text-xs text-muted-foreground">Below reorder point</p>
          </CardContent>
        </Card>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><TrendingUp className="mr-2 h-5 w-5" /> Top Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2">
                    {kpis?.topProducts.map((p: TopProductItem, i) => (
                        <li key={i} className="flex justify-between text-sm">
                            <span>{p.productName}</span>
                            <span className="font-medium">{p.quantitySold} sold</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><List className="mr-2 h-5 w-5" /> Low Stock Items</CardTitle>
            </CardHeader>
            <CardContent>
                {kpis && kpis.stockAlertItems.length > 0 ? (
                    <ul className="space-y-2">
                        {kpis.stockAlertItems.map((item: StockAlertItem) => (
                            <li key={item.id} className="text-sm">{item.name}</li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-muted-foreground">All materials are above reorder points.</p>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6"><Skeleton className="h-8 w-48" /></h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card><CardHeader><Skeleton className="h-4 w-32" /></CardHeader><CardContent><Skeleton className="h-10 w-40" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-4 w-32" /></CardHeader><CardContent><Skeleton className="h-10 w-40" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-4 w-32" /></CardHeader><CardContent><Skeleton className="h-10 w-40" /></CardContent></Card>
            </div>
        </div>
    )
}