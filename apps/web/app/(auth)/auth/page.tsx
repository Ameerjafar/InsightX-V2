"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000/api/v1";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setStatus("");
    try {
      const url = `${API_BASE}/${mode}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Request failed");
      setStatus("Email sent. Check your inbox.");
    } catch (e: any) {
      setStatus(e.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-6 max-w-md mx-auto grid gap-6">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-semibold">{mode === "signin" ? "Sign in" : "Sign up"}</h2>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setMode("signin")} disabled={mode === "signin"}>Sign in</Button>
              <Button variant="secondary" onClick={() => setMode("signup")} disabled={mode === "signup"}>Sign up</Button>
            </div>
            <input
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-3 py-2 rounded bg-slate-800 border border-slate-700"
            />
            <Button onClick={submit} disabled={loading || !email}>
              {loading ? "Sending..." : "Send magic link"}
            </Button>
            {!!status && <p className="text-slate-300">{status}</p>}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}


