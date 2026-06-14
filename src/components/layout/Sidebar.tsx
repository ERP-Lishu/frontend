"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Package,
  ListChecks,
  Tag,
  ShoppingCart,
  ArrowLeftRight,
  Wrench,
  Receipt,
  Wallet,
  Building,
  BarChart3,
  UserCheck,
  Database,
  Gift,
  HelpCircle,
  BookOpen,
  Sparkles,
  Settings,
  ChevronDown,
  ChevronRight,
  Monitor,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: { label: string; href: string }[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Parties", href: "/parties", icon: Users },
  // { label: "Orders", href: "/orders", icon: ClipboardList },
  { label: "Inventory", href: "/inventory", icon: Package },
  // { label: "Bill of Materials", href: "/bom", icon: ListChecks },
  {
    label: "Sales",
    icon: Tag,
    children: [
      { label: "Sales Invoices", href: "/sales/invoices" },
      { label: "Payment In", href: "/sales/payments" },
      // { label: "Quotations", href: "/sales/quotations" },
      { label: "Sales Return", href: "/sales/returns" },
    ],
  },
  {
    label: "Purchase",
    icon: ShoppingCart,
    children: [
      { label: "Purchase Bills", href: "/purchase/bills" },
      { label: "Payment Out", href: "/purchase/payments" },
      { label: "Purchase Return", href: "/purchase/returns" },
    ],
  },
  // { label: "Stock Transfer", href: "/transfer", icon: ArrowLeftRight },
  // { label: "Production", href: "/production", icon: Wrench },
  { label: "Expense", href: "/expense", icon: Receipt },
  // { label: "Other Income", href: "#", icon: Wallet },
  // { label: "Manage Accounts", href: "#", icon: Building },
];

const managementItems: NavItem[] = [
  { label: "Reports", href: "#", icon: BarChart3 },
  { label: "Manage Staffs", href: "#", icon: UserCheck },
  { label: "Import Data", href: "#", icon: Database },
  { label: "Business Tools", href: "#", icon: Settings },
  { label: "Refer & Win", href: "#", icon: Gift },
];

const otherItems: NavItem[] = [
  { label: "Help & Support", href: "#", icon: HelpCircle },
  { label: "Tutorials", href: "#", icon: BookOpen },
  { label: "What's New", href: "#", icon: Sparkles },
  { label: "Settings", href: "#", icon: Settings },
];

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(
    () => item.children?.some((c) => pathname.startsWith(c.href)) ?? false,
  );

  if (item.children) {
    const isActive = item.children.some((c) => pathname.startsWith(c.href));
    return (
      <div>
        <button
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2 mx-2 text-sm transition-colors",
            "text-gray-500 hover:bg-gray-50",
            isActive && "text-[#29ad82]",
          )}
          style={{ width: "calc(100% - 16px)" }}
        >
          <item.icon size={16} />
          <span className="flex-1 text-left">{item.label}</span>
          {open ? (
            <ChevronDown size={12} className="opacity-50" />
          ) : (
            <ChevronRight size={12} className="opacity-50" />
          )}
        </button>
        {open && (
          <div className="flex flex-col">
            {item.children.map((child) => {
              const active =
                pathname === child.href ||
                pathname.startsWith(child.href + "/");
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={cn(
                    "pl-10 py-1.5 text-xs rounded-lg mx-2 transition-colors",
                    "text-[#29ad82] hover:bg-[#edfaf4]",
                    active && "font-semibold",
                  )}
                >
                  {child.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const active =
    pathname === item.href ||
    (item.href !== "/" && pathname.startsWith(item.href!));
  return (
    <Link
      href={item.href!}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3.5 py-2 mx-2 text-sm transition-colors",
        active ? "bg-[#29ad82] text-white" : "text-gray-500 hover:bg-gray-50",
      )}
    >
      <item.icon size={16} />
      {item.label}
    </Link>
  );
}

export function Sidebar() {
  return (
    <aside className="w-[220px] flex-shrink-0 bg-white border-r border-[#efefef] flex flex-col overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-[#f5f5f5]">
        <div className="w-8 h-8 bg-[#29ad82] rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          S
        </div>
        <span className="text-base font-bold text-[#1a1a1a]">SOCH</span>
      </div>

      {/* Business selector */}
      <div className="mx-2.5 my-2 border border-[#efefef] rounded-xl px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-gray-50">
        <div className="w-7 h-7 rounded-full bg-[#29ad82] text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">
          B
        </div>
        <span className="text-[12.5px] font-semibold text-[#1a1a1a] flex-1">
          BN - 2082
        </span>
        <ChevronDown size={13} className="text-gray-300" />
      </div>

      {/* POS shortcut */}
      {/* <div className="px-2 mb-1">
        <Link
          href="/pos"
          className="flex items-center gap-2.5 rounded-lg px-3.5 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <Monitor size={16} />
          Quick POS
        </Link>
      </div> */}

      {/* Business section */}
      <p className="text-[10px] text-gray-300 font-semibold uppercase tracking-wide px-4 pt-2 pb-1">
        Business
      </p>
      {navItems.map((item) => (
        <NavLink key={item.label} item={item} />
      ))}

      {/* Management section */}
      {/* <p className="text-[10px] text-gray-300 font-semibold uppercase tracking-wide px-4 pt-3 pb-1">
        Management
      </p>
      {managementItems.map((item) => (
        <NavLink key={item.label} item={item} />
      ))} */}

      {/* Others */}
      <p className="text-[10px] text-gray-300 font-semibold uppercase tracking-wide px-4 pt-3 pb-1">
        Others
      </p>
      {otherItems.map((item) => (
        <NavLink key={item.label} item={item} />
      ))}
      <div className="h-4" />
    </aside>
  );
}
