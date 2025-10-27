import { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/server/db';
import { compare } from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !(await compare(credentials.password, user.passwordHash))) {
          return null;
        }

        // The object returned here is passed to the 'jwt' callback
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    // --- THIS IS THE CRITICAL FIX ---
    // This callback is called whenever a JWT is created or updated.
    jwt: ({ token, user }) => {
      // On the initial sign-in, the `user` object from `authorize` is available.
      // We must persist the user ID from this object into the token.
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    // This callback is called whenever a session is checked.
    session: ({ session, token }) => {
      // We must take the user ID from the token and add it to the `session.user` object.
      // The `token.id` is what we persisted in the `jwt` callback.
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};