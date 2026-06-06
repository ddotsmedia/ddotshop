import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      tenantId?: string;
      shopId?: string;
      shopSlug?: string;
      plan?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    tenantId?: string;
    shopId?: string;
    shopSlug?: string;
    plan?: string;
  }
}
