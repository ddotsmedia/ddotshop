"use client";

import { useState } from "react";
import { Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export function ShiprocketButton({ orderId, awb, courier }: { orderId: string; awb?: string | null; courier?: string | null }) {
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<{ awb: string; courier: string } | null>(
    awb ? { awb, courier: courier ?? "" } : null,
  );

  async function create() {
    setLoading(true);
    const res = await fetch("/api/shipping/shiprocket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    const d = await res.json();
    setLoading(false);
    if (res.ok) {
      setCreated({ awb: d.awb, courier: d.courier });
      toast({ title: "Shipment created", variant: "success" });
    } else {
      toast({ title: d.error ?? "Failed", variant: "danger" });
    }
  }

  if (created?.awb) {
    return (
      <div className="space-y-2 text-sm">
        <p className="text-[#6b7280]">Courier: <span className="font-medium text-[#111827]">{created.courier || "—"}</span></p>
        <p className="text-[#6b7280]">AWB: <span className="font-mono">{created.awb}</span></p>
        <a href={`https://shiprocket.co/tracking/${created.awb}`} target="_blank" rel="noopener noreferrer">
          <Button size="sm" variant="secondary"><Truck className="h-4 w-4" /> Track Shipment</Button>
        </a>
      </div>
    );
  }

  return (
    <Button size="sm" onClick={create} disabled={loading}>
      <Truck className="h-4 w-4" /> {loading ? "Creating…" : "Create Shiprocket shipment"}
    </Button>
  );
}
