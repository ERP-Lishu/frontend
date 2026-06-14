"use client";

import { Plus, Search, ChevronDown, Settings2 } from "lucide-react";
import Link from "next/link";

interface SalesHeaderProps {
  count: number;
  search: string;
  onSearchChange: (v: string) => void;
}

export function SalesHeader({ count, search, onSearchChange }: SalesHeaderProps) {
  return (
    <>
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#efefef]">
        <h1 className="text-[18px] font-bold text-[#1a1a1a]">
          Sales Invoices{" "}
          <span className="text-[14px] font-normal text-gray-400">({count})</span>
        </h1>
        <div className="flex items-center gap-2.5">
          <button className="w-8 h-8 border border-[#e0e0e0] rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-50">
            <Settings2 size={15} />
          </button>
          <Link
            href="/sales/invoices/create"
            className="flex items-center gap-1.5 text-[13px] font-semibold bg-[#29ad82] text-white rounded-lg px-4 py-2 hover:bg-[#1d9470] transition-colors"
          >
            <Plus size={14} /> Create Sales Invoice
          </Link>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex items-center gap-2.5 px-6 py-3 border-b border-[#f5f5f5]">
        <div className="flex items-center gap-2 bg-[#f7f7f7] border border-[#ebebeb] rounded-lg px-3 py-1.5 w-64">
          <Search size={13} className="text-gray-400 flex-shrink-0" />
          <input
            className="flex-1 bg-transparent outline-none text-[12.5px] text-gray-700 placeholder:text-gray-400"
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-1.5 text-[12.5px] border border-[#e5e5e5] rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-600">
          All Status <ChevronDown size={12} />
        </button>
        <button className="flex items-center gap-1.5 text-[12.5px] border border-[#e5e5e5] rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-600">
          All Date <ChevronDown size={12} />
        </button>
        <div className="ml-auto">
          <button className="flex items-center gap-1.5 text-[12.5px] border border-[#e5e5e5] rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-600">
            Sort By <ChevronDown size={12} />
          </button>
        </div>
      </div>
    </>
  );
}
