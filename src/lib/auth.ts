import { PrismaAdapter } from '@auth/prisma-adapter'
import NextAuth from 'next-auth'
import type { NextAuthConfig } from 'next-auth'
import Resend from 'next-auth/providers/resend'
import { prisma } from '@/lib/prisma'

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    }),
  ],
  pages: {
    signIn: '/login',
    verifyRequest: '/verify',
    error: '/login',
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
  },
  session: {
    strategy: 'database',
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
