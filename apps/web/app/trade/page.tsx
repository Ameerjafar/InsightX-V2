"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000/api/v1";

type Asset = { symbol: string; name: string; imageUrl: string; decimal: number };

export default function TradePage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [asset, setAsset] = useState("");
  const [type, setType] = useState<"long" | "short">("long");
  const [margin, setMargin] = useState<number>(100);
  const [leverage, setLeverage] = useState<number>(5);
  const [slippage, setSlippage] = useState<number>(0.1);
  const [userId, setUserId] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [orderIdToClose, setOrderIdToClose] = useState("");

  useEffect(() => {
    async function loadAssets() {
      try {
        const res = await fetch(`${API_BASE}/supportedAssets`);
        const data = await res.json();
        if (res.ok) setAssets(data.assets || []);
      } catch {}
    }
    loadAssets();
  }, []);

  async function createOrder() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/trade/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset, type, margin, leverage, slippage, userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to create order");
      setMessage(`Created. Order ${data.orderId}`);
    } catch (e: any) {
      setMessage(e.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function closeOrder() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/trade/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderIdToClose, userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to close order");
      setMessage(`Closed. Order ${data.orderId}`);
    } catch (e: any) {
      setMessage(e.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-6 grid gap-6">
      <h2 className="text-2xl font-semibold">Trade</h2>
      <Card>
        <CardHeader>
          <div className="text-slate-300">Create Order</div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <label className="flex items-center gap-2">
              <span className="w-32">User ID</span>
              <input className="flex-1 px-3 py-2 rounded bg-slate-800 border border-slate-700" value={userId} onChange={(e) => setUserId(e.target.value)} />
            </label>
            <label className="flex items-center gap-2">
              <span className="w-32">Asset</span>
              <select className="flex-1 px-3 py-2 rounded bg-slate-800 border border-slate-700" value={asset} onChange={(e) => setAsset(e.target.value)}>
                <option value="">Select...</option>
                {assets.map(a => (
                  <option key={a.symbol} value={a.symbol}>{a.symbol}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span className="w-32">Type</span>
              <select className="flex-1 px-3 py-2 rounded bg-slate-800 border border-slate-700" value={type} onChange={(e) => setType(e.target.value as any)}>
                <option value="long">Long</option>
                <option value="short">Short</option>
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span className="w-32">Margin (cents)</span>
              <input type="number" className="flex-1 px-3 py-2 rounded bg-slate-800 border border-slate-700" value={margin} onChange={(e) => setMargin(Number(e.target.value))} />
            </label>
            <label className="flex items-center gap-2">
              <span className="w-32">Leverage</span>
              <input type="number" className="flex-1 px-3 py-2 rounded bg-slate-800 border border-slate-700" value={leverage} onChange={(e) => setLeverage(Number(e.target.value))} />
            </label>
            <label className="flex items-center gap-2">
              <span className="w-32">Slippage</span>
              <input type="number" step="0.01" className="flex-1 px-3 py-2 rounded bg-slate-800 border border-slate-700" value={slippage} onChange={(e) => setSlippage(Number(e.target.value))} />
            </label>
            <div className="flex gap-2">
              <Button onClick={createOrder} disabled={loading || !asset || !userId}>Create</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="text-slate-300">Close Order</div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <input className="px-3 py-2 rounded bg-slate-800 border border-slate-700" placeholder="Order ID to close" value={orderIdToClose} onChange={(e) => setOrderIdToClose(e.target.value)} />
            <Button variant="danger" onClick={closeOrder} disabled={loading || !orderIdToClose || !userId}>Close</Button>
          </div>
        </CardContent>
      </Card>

      {message && <p className="text-slate-300">{message}</p>}
    </main>
  );
}


