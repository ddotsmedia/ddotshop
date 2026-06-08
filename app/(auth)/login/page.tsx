"use client";

import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LoginSchema } from "@/lib/validations";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormValues = z.infer<typeof LoginSchema>;

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(LoginSchema) });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { ...values, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password");
      return;
    }
    // Role-based destination: super admins land in the admin panel.
    const session = await getSession();
    const dest =
      session?.user?.role === "SUPER_ADMIN"
        ? "/admin-panel"
        : callbackUrl;
    router.push(dest);
    router.refresh();
  };

  return (
    <Card>
      <CardContent className="space-y-4">
        <div>
          <h1 className="text-xl font-bold">Welcome back</h1>
          <p className="text-sm text-[#6b7280]">Log in to your DdotsShop dashboard</p>
        </div>

        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => signIn("google", { callbackUrl })}
        >
          Continue with Google
        </Button>

        <div className="flex items-center gap-3 text-xs text-[#9ca3af]">
          <span className="h-px flex-1 bg-[#e5e7eb]" /> or <span className="h-px flex-1 bg-[#e5e7eb]" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && (
              <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
            )}
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Logging in…" : "Log in"}
          </Button>
        </form>

        <p className="text-center text-sm text-[#6b7280]">
          No account?{" "}
          <Link href="/signup" className="font-semibold text-wa-dark">
            Sign up free
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
