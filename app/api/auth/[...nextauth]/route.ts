import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prismaClient } from "@/app/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      await prismaClient.user.upsert({
        where: { email: user.email },
        update: {},
        create: {
          id: account?.providerAccountId,
          email: user.email,
          provider: "Google",
        },
      });

      return true;
    },

    async jwt({ token, account }) {
      if (account || !token.id) {
        const dbUser = await prismaClient.user.findUnique({
          where: { email: token.email! },
          select: { id: true },
        });
        if (dbUser) token.id = dbUser.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
