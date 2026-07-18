"use client";

import { Plus, Search, ChevronDown, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/shared/StatusBadge";

interface Column { key: string; label: string }
interface Row { [k: string]: string }

interface SimpleListPageProps {
  title: string;
  columns: Column[];
  rows: Row[];
  actionLabel?: string;
  actionHref?: string;
}

export function SimpleListPage({ title, columns, rows, actionLabel = "Create", actionHref }: SimpleListPageProps) {
  const router = useRouter();
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#efefef]">
        <h1 className="text-[18px] font-bold text-[#1a1a1a]">{title}</h1>
        <div className="flex items-center gap-2.5">
          <button className="text-[12.5px] border border-[#e0e0e0] rounded-lg px-3 py-1.5 hover:bg-gray-50">Export</button>
          <button
            onClick={() => actionHref && router.push(actionHref)}
            className="flex items-center gap-1.5 text-[12.5px] bg-[#29ad82] text-white rounded-lg px-3 py-1.5 hover:bg-[#1d9470] transition-colors"
          >
            <Plus size={13} /> {actionLabel}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2.5 px-6 py-3 border-b border-[#f5f5f5]">
        <div className="flex items-center gap-2 bg-[#f7f7f7] border border-[#ebebeb] rounded-lg px-3 py-1.5 w-60">
          <Search size={13} className="text-gray-400 flex-shrink-0" />
          <input className="flex-1 bg-transparent outline-none text-[12.5px] text-gray-700 placeholder:text-gray-400" placeholder={`Search ${title.toLowerCase()}...`} />
        </div>
        {["Status", "Date Range"].map((f) => (
          <button key={f} className="flex items-center gap-1.5 text-[12.5px] border border-[#e5e5e5] rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-600">
            {f} <ChevronDown size={12} />
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-white border-b border-[#f0f0f0] z-10">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="text-left px-5 py-3 text-[12px] text-gray-400 font-medium">{c.label}</th>
              ))}
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-[#f8f8f8] hover:bg-gray-50 cursor-pointer">
                {columns.map((c) => (
                  <td key={c.key} className="px-5 py-3.5 text-[13px]">
                    {c.key === "status" ? (
                      <StatusBadge label={row[c.key]} />
                    ) : (
                      <span className={c.key === "no" ? "font-medium text-[#29ad82]" : "text-gray-700"}>{row[c.key]}</span>
                    )}
                  </td>
                ))}
                <td className="px-5 py-3.5">
                  <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
