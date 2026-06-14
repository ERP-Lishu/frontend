"use client";

import { useRef } from "react";
import { Search, SlidersHorizontal, Plus, ChevronDown } from "lucide-react";
import type { Party } from "@/lib/types";
import { partyStatus, statusColor } from "./PartyDetailPanel";

export type PaymentFilter = "All Payment" | "To Receive" | "To Give" | "Settled";
export type TypeFilter = "all" | "c" | "s";

const PAYMENT_OPTIONS: PaymentFilter[] = ["All Payment", "To Receive", "To Give", "Settled"];
const SORT_OPTIONS = ["Latest", "Amount: High to Low", "Amount: Low to High", "Name: A to Z", "Name: Z to A"];

interface PartyListPanelProps {
  parties: Party[];
  selected: string | null;
  search: string;
  paymentFilter: PaymentFilter;
  typeFilter: TypeFilter;
  sortBy: string;
  paymentDropOpen: boolean;
  sortDropOpen: boolean;
  paymentDropRef: React.RefObject<HTMLDivElement | null>;
  sortDropRef: React.RefObject<HTMLDivElement | null>;
  onSelect: (name: string) => void;
  onSearchChange: (v: string) => void;
  onPaymentFilterChange: (f: PaymentFilter) => void;
  onTypeFilterChange: (f: TypeFilter) => void;
  onSortChange: (s: string) => void;
  onPaymentDropToggle: () => void;
  onSortDropToggle: () => void;
  onAddClick: () => void;
}

export function PartyListPanel({
  parties,
  selected,
  search,
  paymentFilter,
  typeFilter,
  sortBy,
  paymentDropOpen,
  sortDropOpen,
  paymentDropRef,
  sortDropRef,
  onSelect,
  onSearchChange,
  onPaymentFilterChange,
  onTypeFilterChange,
  onSortChange,
  onPaymentDropToggle,
  onSortDropToggle,
  onAddClick,
}: PartyListPanelProps) {
  return (
    <div className="w-[360px] flex-shrink-0 border-r border-[#efefef] flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[#f0f0f0]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[15.5px] font-bold text-[#1a1a1a]">
            Parties ({parties.length})
          </span>
          <div className="flex rounded-lg overflow-hidden">
            <button
              onClick={onAddClick}
              className="flex items-center gap-1.5 bg-[#29ad82] text-white px-3.5 py-1.5 text-[13px] font-semibold hover:bg-[#1d9470] transition-colors"
            >
              <Plus size={14} /> Add Party
            </button>
            <div className="w-px bg-white/30" />
            <button
              onClick={onAddClick}
              className="bg-[#29ad82] text-white px-2.5 py-1.5 hover:bg-[#1d9470] transition-colors"
            >
              <ChevronDown size={14} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-2 mb-2.5">
          <div className="flex-1 flex items-center gap-2 bg-[#f7f7f7] border border-[#e8e8e8] rounded-lg px-2.5 py-1.5">
            <Search size={13} className="text-gray-400 flex-shrink-0" />
            <input
              className="flex-1 bg-transparent outline-none text-[12.5px] text-gray-700 placeholder:text-gray-400"
              placeholder="Search parties..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <div className="relative" ref={sortDropRef}>
            <button
              onClick={onSortDropToggle}
              className={`w-8 h-8 border rounded-lg flex items-center justify-center bg-white hover:bg-gray-50 flex-shrink-0 transition-colors ${sortDropOpen ? "border-[#29ad82] text-[#29ad82]" : "border-[#e5e5e5] text-gray-500"}`}
            >
              <SlidersHorizontal size={14} />
            </button>
            {sortDropOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-[185px] bg-white rounded-xl shadow-xl border border-[#efefef] z-30 overflow-hidden py-0.5">
                <div className="px-3.5 py-1.5 text-[10.5px] text-gray-400 font-semibold uppercase tracking-wide border-b border-[#f5f5f5]">
                  Sort By
                </div>
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => onSortChange(opt)}
                    className="flex items-center gap-2 w-full px-3.5 py-2 text-[12.5px] text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <span className={`w-3.5 text-[#29ad82] text-[12px] ${sortBy === opt ? "opacity-100" : "opacity-0"}`}>✓</span>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5">
          <button
            onClick={() => onTypeFilterChange(typeFilter === "c" ? "all" : "c")}
            className={`px-3 py-1 text-[12.5px] border rounded-lg whitespace-nowrap transition-colors ${typeFilter === "c" ? "border-[#29ad82] text-[#29ad82] bg-[#edfaf4]" : "border-[#d9d9d9] text-gray-600 hover:bg-gray-50"}`}
          >
            Customer
          </button>
          <button
            onClick={() => onTypeFilterChange(typeFilter === "s" ? "all" : "s")}
            className={`px-3 py-1 text-[12.5px] border rounded-lg whitespace-nowrap transition-colors ${typeFilter === "s" ? "border-[#29ad82] text-[#29ad82] bg-[#edfaf4]" : "border-[#d9d9d9] text-gray-600 hover:bg-gray-50"}`}
          >
            Supplier
          </button>

          <div className="relative" ref={paymentDropRef}>
            <button
              onClick={onPaymentDropToggle}
              className="flex items-center gap-1 px-3 py-1 text-[12.5px] border border-[#d9d9d9] rounded-lg hover:bg-gray-50 text-gray-600 whitespace-nowrap"
            >
              {paymentFilter} <ChevronDown size={11} />
            </button>
            {paymentDropOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-[160px] bg-white rounded-xl shadow-xl border border-[#efefef] z-30 overflow-hidden py-1">
                {PAYMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => onPaymentFilterChange(opt)}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <span className={`w-4 text-[#29ad82] ${paymentFilter === opt ? "opacity-100" : "opacity-0"}`}>✓</span>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Party list */}
      <div className="flex-1 overflow-y-auto">
        {parties.length === 0 && (
          <div className="text-center py-8 text-[13px] text-gray-400">No parties found</div>
        )}
        {parties.map((p) => {
          const st = partyStatus(p);
          const isSelected = selected === p.name;
          return (
            <div
              key={p.name}
              onClick={() => onSelect(p.name)}
              className={`flex items-center gap-3.5 px-4 py-3.5 border-b border-[#f5f5f5] cursor-pointer transition-colors relative ${isSelected ? "bg-[#edfaf4]" : "hover:bg-[#fafafa]"}`}
            >
              {isSelected && (
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#29ad82] rounded-r-sm" />
              )}
              <div className="w-[44px] h-[44px] rounded-xl bg-[#29ad82] text-white flex items-center justify-center text-[13px] font-bold flex-shrink-0">
                {p.init}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-semibold text-[#1a1a1a] truncate">{p.name}</div>
                <div className="text-[12px] text-gray-400 mt-0.5">{p.ph || "---"}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className={`text-[13.5px] font-semibold ${statusColor(st)}`}>{p.amt}</div>
                <div className={`text-[11px] mt-0.5 ${statusColor(st)}`}>{st}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
