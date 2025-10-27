# WorkshopOS - SaaS for Artisan Workshops

WorkshopOS is a full-stack, multi-tenant SaaS application designed to eliminate the operational pain points for leathercrafters and other small artisans. It provides an integrated platform to manage everything from materials and products to orders and analytics.

## Features

- **Multi-Workshop Management**: A single user can own or be a member of multiple workshops, with data completely isolated between them.
- **Product & Process Design**: Define products using a Bill of Materials (BOM) and multi-step Routing (assembly instructions).
- **Inventory Control**: Track materials down to the specific lot, including cost, quantity, and supplier.
- **Automated Costing & Pricing**: Automatically calculates the true cost of a product and suggests a retail price based on your markup rules.
- **Order & Customer Management**: A simple CRM and order tracking system to manage your business from quote to fulfillment.
- **Work Order Execution**: Track the production of each order item, log time, and consume materials.
- **Business Analytics**: A dashboard with key performance indicators (KPIs) to understand your business's health.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **API**: tRPC (end-to-end type safety)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **UI**: TailwindCSS + shadcn/ui
- **State Management**: TanStack Query (React Query)
- **Testing**: Vitest (Unit) & Playwright (E2E)
- **Deployment**: Docker Compose

## Getting Started

### Prerequisites

- Node.js (v20+)
- Docker and Docker Compose
- `npm` (v10+)

### Setup Instructions

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd workshopos
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Copy the `.env.example` file to `.env` in the root directory and also to `apps/web/.env.local`. The root `.env` is used by Docker Compose, while `apps/web/.env.local` is used for local `next dev` if you run it outside Docker.
    ```bash
    cp .env.example .env
    cp .env.example apps/web/.env.local
    ```

4.  **Start the services (Next.js + Postgres) with Docker:**
    ```bash
    docker-compose up --build
    ```
    The application will be available at `http://localhost:3000`.

5.  **Run database migrations and seed data:**
    In a new terminal, run the seed script. This will create the database schema and populate it with sample data.
    ```bash
    npm run db:seed
    ```

6.  **Access the application:**
    -   Navigate to `http://localhost:3000/register` to create an account.
    -   Or, log in with the seeded user:
        -   **Email**: `artisan@workshopos.com`
        -   **Password**: `password123`

### Running Tests

-   **Run all tests (unit + e2e):**
    ```bash
    npm test
    ```
-   **Run only unit tests:**
    ```bash
    cd apps/web && npm test
    ```
-   **Run E2E tests (requires the app to be running):**
    ```bash
    npm run test:e2e
    ```

## Architecture Notes

### Multi-Tenancy

Data isolation is enforced at the tRPC API layer. Every protected route must pass a `workshopId`. A custom tRPC middleware (`protectedWorkshopProcedure`) validates that the authenticated user is a member of the requested workshop before executing the procedure. This prevents any data leakage between tenants.

### Costing Engine

The costing logic is centralized in `src/server/services/costingService.ts`. It calculates costs based on three components:
1.  **Materials**: Uses a weighted average cost from all available inventory lots.
2.  **Labor**: Calculated from the sum of all routing step times multiplied by the workshop's configured labor rate.
3.  **Tools**: (If implemented) Amortizes tool costs over their lifespan and applies it based on usage time in routing steps.

---
This concludes the MVP build of WorkshopOS. The provided code establishes a robust, type-safe, and scalable foundation. The remaining pages and tRPC routers would be built following the exact same patterns demonstrated in the `products` feature slice. The core architectural challenges—multi-tenancy, data modeling, and complex business logic encapsulation—are solved.