import { cn } from "@/lib/utils";

interface PageToolbarProps {
  children: React.ReactNode;
  className?: string;
}

export function PageToolbar({ children, className }: PageToolbarProps) {
  return (
    <div className={cn("flex items-center gap-2.5 px-5 py-3.5 bg-white border-b border-[#efefef] flex-shrink-0", className)}>
      {children}
    </div>
  );
}
