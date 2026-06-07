"use client";

import { useState } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

export interface LoyaltyProgramData {
  pointsPerAED: number;
  rewardThreshold: number;
  rewardValue: number;
  isActive: boolean;
}

export function LoyaltySettings({ initial }: { initial: LoyaltyProgramData }) {
  const [p, setP] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/loyalty", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pointsPerAED: Number(p.pointsPerAED),
        rewardThreshold: Number(p.rewardThreshold),
        rewardValue: Number(p.rewardValue),
        isActive: p.isActive,
      }),
    });
    setSaving(false);
    toast(res.ok ? { title: "Saved", variant: "success" } : { title: "Save failed", variant: "danger" });
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle>Program settings</CardTitle>
          <label className="flex items-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => setP({ ...p, isActive: !p.isActive })}
              className={`relative h-6 w-11 rounded-full ${p.isActive ? "bg-wa-green" : "bg-gray-300"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${p.isActive ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
            {p.isActive ? "Active" : "Inactive"}
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Points per AED</Label>
            <Input type="number" value={p.pointsPerAED} onChange={(e) => setP({ ...p, pointsPerAED: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Reward threshold (points)</Label>
            <Input type="number" value={p.rewardThreshold} onChange={(e) => setP({ ...p, rewardThreshold: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Reward value (AED)</Label>
            <Input type="number" value={p.rewardValue} onChange={(e) => setP({ ...p, rewardValue: Number(e.target.value) })} />
          </div>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </CardContent>
    </Card>
  );
}
