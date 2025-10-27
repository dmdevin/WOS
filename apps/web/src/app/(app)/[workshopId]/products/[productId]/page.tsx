'use client';

import { api } from '@/trpc/react';
import { useParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { type ProductWithDetails } from '@/server/api/routers/products';

// Use NonNullable to ensure the types are derived from a valid product object
type ProductVersion = NonNullable<ProductWithDetails>['versions'][number];
type BomItem = ProductVersion['bomItems'][number];
type RouteStep = ProductVersion['routing'][number];

export default function ProductDetailPage() {
    const params = useParams();
    const workshopId = params.workshopId as string;
    const productId = params.productId as string;

    const { data: product, isLoading } = api.products.getById.useQuery(
        {
            workshopId,
            productId,
        },
        {
            // THE FIX: This query will NOT run until `productId` is a truthy value.
            enabled: !!productId,
        }
    );

    const latestVersion = product?.versions[0];

    const { data: costData, isLoading: isCostingLoading } = api.products.getCosting.useQuery(
        {
            workshopId,
            productVersionId: latestVersion?.id ?? '',
        },
        // This second query is dependent on the first one finishing successfully.
        { enabled: !!latestVersion }
    );

    // Show a loading skeleton if the main query is running OR if we are still waiting for the ID.
    if (isLoading || !productId) return <ProductDetailSkeleton />;
    if (!product || !latestVersion) return <div>Product not found.</div>;

    return (
        <div>
            <div className="mb-4">
                <h1 className="text-3xl font-bold">{product.name}</h1>
                <p className="text-muted-foreground">SKU: {product.sku}</p>
                <p className="text-sm">Latest Version: {latestVersion.version}</p>
            </div>

            <Tabs defaultValue="overview">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="bom">Bill of Materials</TabsTrigger>
                    <TabsTrigger value="routing">Routing</TabsTrigger>
                    <TabsTrigger value="cost">Cost & Price</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Product Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>{product.description || 'No description provided.'}</p>
                            <div className="mt-4">
                                <Badge variant={latestVersion.isActive ? 'default' : 'secondary'}>
                                    {latestVersion.isActive ? 'Active' : 'Archived'}
                                </Badge>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">{latestVersion.notes}</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="bom" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle>Bill of Materials</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Material</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Unit</TableHead>
                                        <TableHead>Scrap %</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {latestVersion.bomItems.map((item: BomItem) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.material.name}</TableCell>
                                            <TableCell>{(item.quantity as any).toString()}</TableCell>
                                            <TableCell>{item.material.unitOfMeasure}</TableCell>
                                            <TableCell>{(parseFloat(item.scrapFactor as any) * 100).toFixed(0)}%</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="routing" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle>Production Routing</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Step</TableHead>
                                        <TableHead>Operation</TableHead>
                                        <TableHead>Est. Time (min)</TableHead>
                                        <TableHead>Tool</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {latestVersion.routing.map((step: RouteStep) => (
                                        <TableRow key={step.id}>
                                            <TableCell>{step.stepNumber}</TableCell>
                                            <TableCell>{step.operation.name}</TableCell>
                                            <TableCell>{step.estimatedTimeMin}</TableCell>
                                            <TableCell>{step.tool?.name || 'N/A'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="cost" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cost, Price, & Margin</CardTitle>
                            <CardDescription>Based on current material costs, workshop settings, and your selling price.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isCostingLoading ? <p>Calculating...</p> : (
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Material Cost</span>
                                        <span>${costData?.materialCost.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Labor Cost</span>
                                        <span>${costData?.laborCost.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Overhead Cost</span>
                                        <span>${costData?.overheadCost.toFixed(2)}</span>
                                    </div>
                                    <hr className="my-2" />
                                    <div className="flex justify-between font-bold">
                                        <span>Total Cost</span>
                                        <span>${costData?.totalCost.toFixed(2)}</span>
                                    </div>
                                    <hr className="my-2" />
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Selling Price</span>
                                        <span>${costData?.sellingPrice.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-green-600">
                                        <span>Profit Margin</span>
                                        <span>${costData?.marginAmount.toFixed(2)} ({costData?.marginPercentage.toFixed(1)}%)</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function ProductDetailSkeleton() {
    return (
        <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-32 mb-4" />
            <div className="flex space-x-4 mb-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
            </div>
            <Skeleton className="h-64 w-full" />
        </div>
    )
}