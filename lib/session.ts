import { auth } from "@/lib/auth";

export interface ShopContext {
  userId: string;
  tenantId: string;
  shopId: string;
  shopSlug: string;
  plan: string;
}

/** Returns the current session or null. */
export async function getSession() {
  return auth();
}

/** Throws if not authenticated; returns tenant context (shop may be absent during onboarding). */
export async function requireTenant() {
  const session = await auth();
  if (!session?.user?.id || !session.user.tenantId) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return {
    userId: session.user.id,
    tenantId: session.user.tenantId,
    shopId: session.user.shopId,
    shopSlug: session.user.shopSlug,
    plan: session.user.plan ?? "STARTER",
  };
}

/** Throws if not authenticated or no shop yet. Use in all shop-scoped handlers. */
export async function requireShop(): Promise<ShopContext> {
  const session = await auth();
  if (!session?.user?.id || !session.user.tenantId || !session.user.shopId) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return {
    userId: session.user.id,
    tenantId: session.user.tenantId,
    shopId: session.user.shopId,
    shopSlug: session.user.shopSlug ?? "",
    plan: session.user.plan ?? "STARTER",
  };
}
