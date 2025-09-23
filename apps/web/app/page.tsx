import Link from "next/link";

export default function Home() {
  return (
    <main className="p-6 flex flex-col gap-4">
      <h1 className="text-3xl font-semibold">InsightX</h1>
      <p className="text-slate-300">Trade dashboard with email sign-in.</p>
      <div className="flex gap-3">
        <Link className="text-sky-400 hover:underline" href="/auth">Sign in</Link>
        <Link className="text-sky-400 hover:underline" href="/dashboard">Dashboard</Link>
        <Link className="text-sky-400 hover:underline" href="/trade">Trade</Link>
      </div>
    </main>
  );
}
