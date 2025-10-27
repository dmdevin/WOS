import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Create User
  const passwordHash = await hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'artisan@workshopos.com',
      name: 'Artisan',
      passwordHash,
    },
  });
  console.log(`Created user: ${user.email}`);

  // 2. Create Workshop and link user
  const workshop = await prisma.workshop.create({
    data: {
      name: "Artisan's Leather Co.",
      users: {
        create: {
          userId: user.id,
          role: 'OWNER',
        },
      },
      settings: {
        create: {
          laborRate: 50.0,
          overheadRate: 15.0,
          currency: 'USD',
        }
      }
    },
  });
  console.log(`Created workshop: ${workshop.name}`);

  // 3. Create Materials
  const leather = await prisma.material.create({
    data: {
      workshopId: workshop.id,
      name: 'Veg-Tan Leather 4-5oz',
      category: 'LEATHER',
      unitOfMeasure: 'sqft',
      stockLevel: 50,
      stockAlertThreshold: 10,
      unitCost: 12.50,
    },
  });

  const thread = await prisma.material.create({
    data: {
      workshopId: workshop.id,
      name: 'Ritza Tiger Thread 0.8mm',
      category: 'THREAD',
      unitOfMeasure: 'meter',
      stockLevel: 200,
      stockAlertThreshold: 50,
      unitCost: 0.20,
    },
  });
  console.log('Created materials.');
  
  // 4. Create Operations Library
  const cutLeather = await prisma.operation.create({ data: { workshopId: workshop.id, name: "Cut Leather" } });
  const stitch = await prisma.operation.create({ data: { workshopId: workshop.id, name: "Saddle Stitch" } });
  const finishEdges = await prisma.operation.create({ data: { workshopId: workshop.id, name: "Burnish Edges" } });

  // 5. Create a Product
  const walletProduct = await prisma.product.create({
    data: {
      workshopId: workshop.id,
      name: 'The Minimalist Wallet',
      sku: 'MW-001',
      sellingPrice: 85.00,
      versions: {
        create: {
          version: 1,
          notes: 'Initial version',
          estimatedLaborMinutes: 75,
          bomItems: {
            create: [
              { materialId: leather.id, quantity: 0.75, scrapFactor: 0.1 },
              { materialId: thread.id, quantity: 1.5 },
            ],
          },
          routing: {
            create: [
              { stepNumber: 1, operationId: cutLeather.id, estimatedTimeMin: 20 },
              { stepNumber: 2, operationId: stitch.id, estimatedTimeMin: 40 },
              { stepNumber: 3, operationId: finishEdges.id, estimatedTimeMin: 15 },
            ],
          },
        },
      },
    },
  });
  console.log(`Created product: ${walletProduct.name}`);
  const walletVersion = await prisma.productVersion.findFirst({ where: { productId: walletProduct.id } });

  // 6. Create Customers
  const customer1 = await prisma.customer.create({
    data: { workshopId: workshop.id, name: 'John Doe', email: 'john.doe@example.com' },
  });
  console.log('Created customers');

  // 7. Create an Order using the new 'workflowStage'
  await prisma.order.create({
    data: {
      workshopId: workshop.id,
      customerId: customer1.id,
      orderNumber: 'WOS-1001',
      // THE FIX: Use `workflowStage` instead of `status`
      workflowStage: 'PENDING',
      totalPrice: 85.00,
      orderItems: {
        create: {
          productVersionId: walletVersion!.id,
          quantity: 1,
          unitPrice: 85.00,
        },
      },
    },
  });
  console.log('Created orders');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });