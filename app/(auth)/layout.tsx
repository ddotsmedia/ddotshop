import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-wa-green text-white">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">DdotsShop</span>
        </Link>
        {children}
      </div>
    </div>
  );
}
