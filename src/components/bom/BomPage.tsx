"use client";

import { useState } from "react";
import { Plus, Search, Copy, X } from "lucide-react";
import type { BomEntry } from "@/lib/types";

const bomData: Record<string, BomEntry> = {};

function BomDetailModal({ entry, onClose }: { entry: BomEntry; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-[13px] shadow-2xl w-[560px] max-h-[80vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f0f0] flex-shrink-0">
          <div>
            <div className="text-[15px] font-bold text-[#1a1a1a]">{entry.title}</div>
            <div className="text-[11.5px] text-gray-400 mt-0.5">{entry.sub}</div>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-[11.5px] border border-[#e0e0e0] rounded-lg px-2.5 py-1 flex items-center gap-1 hover:bg-gray-50"><Copy size={12} /> Clone</button>
            <button className="text-[11.5px] border border-[#e0e0e0] rounded-lg px-2.5 py-1 hover:bg-gray-50">✏ Edit</button>
            <button onClick={onClose} className="w-7 h-7 border border-[#e5e5e5] rounded-md flex items-center justify-center hover:bg-gray-50">
              <X size={14} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {entry.items.map((it, i) => (
            <div key={i} className="bg-[#f9fafb] border border-[#f0f0f0] rounded-lg px-3.5 py-2.5 mb-2 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#e8f5e9] flex items-center justify-center text-[#29ad82] text-[15px] flex-shrink-0">●</div>
              <div className="flex-1">
                <div className="text-[12.5px] font-medium text-[#1a1a1a]">{it.nm}</div>
                <div className="text-[11px] text-gray-400">{it.dt}</div>
              </div>
              <div className="text-right">
                <div className="text-[13px] font-semibold text-[#1a1a1a]">{it.qty}</div>
                <div className="text-[11px] text-gray-400">{it.cost}</div>
              </div>
            </div>
          ))}
          <div className="flex justify-between items-center mt-3.5 pt-3 border-t border-[#f0f0f0]">
            <span className="text-[13px] text-gray-400">Total cost per unit</span>
            <span className="text-[17px] font-bold text-[#29ad82]">{entry.cost}</span>
          </div>
        </div>

        <div className="flex justify-end px-5 py-3.5 border-t border-[#f0f0f0]">
          <button onClick={onClose} className="px-4 py-2 text-[13px] border border-[#e5e5e5] rounded-lg hover:bg-gray-50 font-medium">Close</button>
        </div>
      </div>
    </div>
  );
}

export function BomPage() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2.5 px-5 py-3.5 bg-white border-b border-[#efefef] flex-shrink-0">
        <span className="text-[15px] font-semibold text-[#1a1a1a]">Bill of Materials</span>
        <div className="flex items-center gap-2 bg-[#f7f7f7] border border-[#ebebeb] rounded-lg px-3 py-1.5 w-56 ml-2">
          <Search size={13} className="text-gray-400 flex-shrink-0" />
          <input className="flex-1 bg-transparent outline-none text-[12.5px] text-gray-700 placeholder:text-gray-400" placeholder="Search BOM..." />
        </div>
        <div className="ml-auto">
          <button className="flex items-center gap-1.5 text-[12.5px] bg-[#29ad82] text-white rounded-lg px-3 py-1.5 hover:bg-[#1d9470] transition-colors">
            <Plus size={13} /> Add BOM
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 bg-[#f9fafb]">
        {Object.entries(bomData).map(([key, entry]) => (
          <div
            key={key}
            onClick={() => setSelected(key)}
            className="bg-white border border-[#efefef] rounded-xl p-4 mb-3 cursor-pointer hover:border-[#29ad82] transition-colors"
          >
            <div className="flex items-start justify-between mb-2.5">
              <div>
                <div className="text-[14px] font-semibold text-[#1a1a1a]">{entry.title}</div>
                <div className="text-[11.5px] text-gray-400 mt-0.5">{entry.sub}</div>
              </div>
              <div className="text-right">
                <div className="text-[16px] font-bold text-[#29ad82]">{entry.cost}</div>
                <div className="text-[10.5px] text-gray-400 mt-0.5">per unit cost</div>
              </div>
            </div>
            {entry.items.map((it, i) => (
              <div key={i} className="bg-[#f9fafb] border border-[#f0f0f0] rounded-lg px-3.5 py-2 mb-1.5 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#e8f5e9] flex items-center justify-center text-[#29ad82] flex-shrink-0 text-sm">●</div>
                <div className="flex-1">
                  <div className="text-[12.5px] font-medium text-[#1a1a1a]">{it.nm}</div>
                  <div className="text-[11px] text-gray-400">{it.dt}</div>
                </div>
                <div className="text-right">
                  <div className="text-[13px] font-semibold text-[#1a1a1a]">{it.qty}</div>
                  <div className="text-[11px] text-gray-400">{it.cost}</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {selected && (
        <BomDetailModal entry={bomData[selected]} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
