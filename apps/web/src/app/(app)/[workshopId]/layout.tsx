'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Home, Package, Users, ShoppingCart, Wrench, Settings, BarChart3, Scissors, Hammer, MessageSquare } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react'; // <-- IMPORT useEffect

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Patterns', href: '/patterns', icon: Scissors },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Materials', href: '/materials', icon: Wrench },
  //{ name: 'Tool Directory', href: '/tools', icon: Hammer },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
  // THE FIX: The href should NOT include the workshopId. It's a top-level page.
  { name: 'Feedback', href: '/feedback', icon: MessageSquare, isGlobal: true },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const workshopId = params.workshopId as string;
  const { data: session } = useSession();
  useEffect(() => {
    if (workshopId) {
      localStorage.setItem('lastActiveWorkshopId', workshopId);
    }
  }, [workshopId]); // This effect runs whenever the workshopId changes
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-100 border-r p-4 flex flex-col">
        <h1 className="text-2xl font-bold mb-6">WorkshopOS</h1>
        <nav className="flex-grow">
          <ul>
            {navItems.map((item) => (
              <li key={item.name} className="mb-2">
                {/* THE FIX: Use a conditional to build the correct URL */}
                <Link 
                  href={item.isGlobal ? item.href : `/${workshopId}${item.href}`} 
                  className="flex items-center p-2 rounded-md hover:bg-gray-200"
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto">
            <p className="text-sm">{session?.user?.email}</p>
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => signOut({ callbackUrl: '/login' })}>
                Sign Out
            </Button>
        </div>
      </aside>
      <main className="flex-1 p-8 bg-gray-50">
        {children}
      </main>
    </div>
  );
}