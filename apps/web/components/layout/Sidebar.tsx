import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-slate-800 min-h-screen hidden md:block">
      <div className="p-4 text-sm text-slate-400">Navigation</div>
      <nav className="px-2 py-2 grid gap-1">
        <Link className="px-3 py-2 rounded hover:bg-slate-800" href="/dashboard">Dashboard</Link>
        <Link className="px-3 py-2 rounded hover:bg-slate-800" href="/trade">Trade</Link>
        <Link className="px-3 py-2 rounded hover:bg-slate-800" href="/auth">Auth</Link>
      </nav>
    </aside>
  );
}


