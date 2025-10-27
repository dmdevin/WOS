'use client';

import { api } from '@/trpc/react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
// THE FIX: Import the explicit server-side type
import { type ProductListOutput } from '@/server/api/routers/products';

// THE FIX: Define the component's type from the imported server type
type ProductInList = ProductListOutput[number];

export default function ProductsPage() {
  const params = useParams();
  const workshopId = params.workshopId as string;

  const { data: products, isLoading, error } = api.products.list.useQuery({ workshopId });

  if (isLoading) return <div>Loading products...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button asChild>
          <Link href={`/${workshopId}/products/new`}>Create Product</Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* THE FIX: Explicitly type the 'product' parameter */}
        {products?.map((product: ProductInList) => (
          <Link key={product.id} href={`/${workshopId}/products/${product.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{product.sku}</p>
                <p className="text-sm">
                  Latest Version: {product.versions[0]?.version ?? 'N/A'}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}