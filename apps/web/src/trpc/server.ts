import 'server-only';

import {
  createTRPCProxyClient,
  loggerLink,
  TRPCClientError,
} from '@trpc/client';
import { callProcedure } from '@trpc/server';
import { observable } from '@trpc/server/observable';
import { type TRPCErrorResponse } from '@trpc/server/rpc';
import { headers } from 'next/headers';
import { cache } from 'react';

import { appRouter, type AppRouter } from '@/server/api/root';
import { createTRPCContext } from '@/server/api/trpc';

const createContext = cache(() => {
  return createTRPCContext();
});

export const api = createTRPCProxyClient<AppRouter>({
  links: [
    loggerLink({
      enabled: (op) =>
        process.env.NODE_ENV === 'development' ||
        (op.direction === 'down' && op.result instanceof Error),
    }),
    () =>
      ({ op }) =>
        observable((observer) => {
          createContext()
            .then((ctx) => {
              // The `callProcedure` function signature has changed.
              // We need to pass the `op` properties directly.
              return callProcedure({
                procedures: appRouter._def.procedures,
                path: op.path,
                getRawInput: async () => op.input, // Pass the required function
                ctx,
                type: op.type,
              });
            })
            .then((data) => {
              observer.next({ result: { data } });
              observer.complete();
            })
            .catch((cause: TRPCErrorResponse) => {
              observer.error(TRPCClientError.from(cause));
            });
        }),
  ],
});