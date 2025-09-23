import { PropsWithChildren } from "react";
import clsx from "clsx";

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={clsx("rounded-lg border border-slate-800 bg-slate-900/50", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={clsx("px-4 py-3 border-b border-slate-800", className)}>{children}</div>;
}

export function CardContent({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={clsx("px-4 py-4", className)}>{children}</div>;
}


