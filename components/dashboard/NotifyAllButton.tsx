"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export function NotifyAllButton({ productId }: { productId: string }) {
  const [sent, setSent] = useState(false);
  async function go() {
    const res = await fetch("/api/waitlist/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    if (res.ok) {
      setSent(true);
      toast({ title: "Back-in-stock alerts queued", variant: "success" });
    } else toast({ title: "Failed", variant: "danger" });
  }
  return (
    <Button size="sm" variant="secondary" onClick={go} disabled={sent}>
      <Bell className="h-3.5 w-3.5" /> {sent ? "Sent" : "Notify all"}
    </Button>
  );
}
