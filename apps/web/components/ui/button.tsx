import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", ...rest },
  ref
) {
  const base = "px-3 py-2 rounded text-sm font-medium disabled:opacity-50";
  const styles =
    variant === "primary"
      ? "bg-sky-600 hover:bg-sky-500"
      : variant === "secondary"
      ? "bg-slate-700 hover:bg-slate-600"
      : "bg-rose-600 hover:bg-rose-500";
  return <button ref={ref} className={clsx(base, styles, className)} {...rest} />;
});


