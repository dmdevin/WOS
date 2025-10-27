'use client';

import { SessionProvider } from 'next-auth/react';
import { TRPCReactProvider } from '@/trpc/react';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <TRPCReactProvider>{children}</TRPCReactProvider>
    </SessionProvider>
  );
}