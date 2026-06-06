import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { LoginSchema } from "@/lib/validations";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/login", error: "/login" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = LoginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  events: {
    // OAuth (Google) sign-ups go through the adapter's createUser — give them a Tenant.
    async createUser({ user }) {
      if (!user.id) return;
      await prisma.tenant
        .create({ data: { userId: user.id, name: user.name ?? "My Shop" } })
        .catch(() => {});
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.uid = user.id;
      // (Re)hydrate tenant/shop context when missing (shop appears after onboarding).
      if (token.uid && (!token.tenantId || !token.shopId)) {
        const tenant = await prisma.tenant.findUnique({
          where: { userId: token.uid as string },
          include: { shop: { select: { id: true, slug: true } } },
        });
        if (tenant) {
          token.tenantId = tenant.id;
          token.plan = tenant.plan;
          token.shopId = tenant.shop?.id;
          token.shopSlug = tenant.shop?.slug;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string) ?? "";
        session.user.tenantId = token.tenantId as string | undefined;
        session.user.shopId = token.shopId as string | undefined;
        session.user.shopSlug = token.shopSlug as string | undefined;
        session.user.plan = token.plan as string | undefined;
      }
      return session;
    },
  },
});
