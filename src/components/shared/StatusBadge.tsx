import { cn } from "@/lib/utils";

type Variant = "green" | "amber" | "red" | "blue" | "purple" | "gray";

const variantClasses: Record<Variant, string> = {
  green:  "bg-[#e8f5e9] text-[#1b5e20]",
  amber:  "bg-[#fff8e1] text-[#e65100]",
  red:    "bg-[#ffebee] text-[#b71c1c]",
  blue:   "bg-[#e3f2fd] text-[#0d47a1]",
  purple: "bg-[#f3e5f5] text-[#4a148c]",
  gray:   "bg-[#f5f5f5] text-[#555]",
};

export function statusVariant(status: string): Variant {
  const s = status.toLowerCase();
  if (s === "paid" || s === "done" || s === "active") return "green";
  if (s === "unpaid" || s === "out of stock" || s === "critical") return "red";
  if (s === "partial" || s === "transit" || s === "low" || s === "stitching") return "amber";
  if (s === "pending" || s === "cutting") return "blue";
  if (s === "qc check") return "purple";
  return "gray";
}

interface StatusBadgeProps {
  label: string;
  variant?: Variant;
  className?: string;
}

export function StatusBadge({ label, variant, className }: StatusBadgeProps) {
  const v = variant ?? statusVariant(label);
  return (
    <span className={cn("inline-block px-2 py-0.5 rounded-md text-[10.5px] font-semibold", variantClasses[v], className)}>
      {label}
    </span>
  );
}
