"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000/api/v1";

type Balances = Record<string, number>;

export default function Dashboard() {
  const [usd, setUsd] = useState<number | null>(null);
  const [balances, setBalances] = useState<Balances>({});
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function load() {
      try {
        const [usdRes, balRes] = await Promise.all([
          fetch(`${API_BASE}/balance/usd`),
          fetch(`${API_BASE}/balance`),
        ]);
        const usdJson = await usdRes.json();
        const balJson = await balRes.json();
        if (usdRes.ok) setUsd(Number(usdJson.balance ?? 0));
        else setError(usdJson.message || "Failed to fetch USD balance");
        if (balRes.ok) setBalances(balJson || {});
      } catch (e: any) {
        setError(e.message || "Failed to load balances");
      }
    }
    load();
  }, []);

  return (
    <main className="p-6 grid gap-6">
      <h2 className="text-2xl font-semibold">Dashboard</h2>
      {error && <p className="text-rose-400">{error}</p>}
      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="text-sm text-slate-400">USD Balance</div>
            <div className="text-3xl font-semibold">{usd ?? '...'}</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <div className="text-sm text-slate-400">Assets</div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {Object.keys(balances).length === 0 ? (
                <p className="text-slate-400">No asset balances.</p>
              ) : (
                Object.entries(balances).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span>{k}</span>
                    <span>{v}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}


