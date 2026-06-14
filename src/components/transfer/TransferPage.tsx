"use client";

import { Plus, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";

const transferHistory: { id: string; from: string; to: string; items: string; date: string; st: string }[] = [];

export function TransferPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2.5 px-5 py-3.5 bg-white border-b border-[#efefef] flex-shrink-0">
        <span className="text-[15px] font-semibold text-[#1a1a1a]">Stock Transfer</span>
        <div className="ml-auto flex gap-2">
          <button className="text-[12.5px] border border-[#e0e0e0] rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50">Filter</button>
          <button className="flex items-center gap-1.5 text-[12.5px] bg-[#29ad82] text-white rounded-lg px-3 py-1.5 hover:bg-[#1d9470] transition-colors">
            <Plus size={13} /> New Transfer
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 bg-[#f9fafb]">
        <div className="grid grid-cols-2 gap-4">
          {/* New Transfer Form */}
          <div className="bg-white border border-[#efefef] rounded-xl p-5">
            <h2 className="text-[14px] font-semibold text-[#1a1a1a] mb-4">New Transfer</h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[12px] text-gray-600 font-medium block mb-1">From Location</label>
                <select className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-[13px] bg-[#f8f8f8] outline-none focus:border-[#29ad82]">
                  <option>Main Warehouse</option>
                  <option>Factory Floor</option>
                  <option>Godown B</option>
                  <option>Showroom</option>
                </select>
              </div>
              <div>
                <label className="text-[12px] text-gray-600 font-medium block mb-1">To Location</label>
                <select className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-[13px] bg-[#f8f8f8] outline-none focus:border-[#29ad82]">
                  <option>Factory Floor</option>
                  <option>Main Warehouse</option>
                  <option>Godown B</option>
                  <option>Showroom</option>
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label className="text-[12px] text-gray-600 font-medium block mb-1">Transfer Date</label>
              <input type="date" className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-[13px] bg-[#f8f8f8] outline-none focus:border-[#29ad82]" />
            </div>
            <div className="mb-4">
              <label className="text-[12px] text-gray-600 font-medium block mb-1">Notes</label>
              <textarea className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-[13px] bg-[#f8f8f8] outline-none focus:border-[#29ad82] resize-none h-16 placeholder:text-gray-300" placeholder="Enter notes..." />
            </div>
            {/* Transfer rows */}
            <div className="mb-3">
              <label className="text-[12px] text-gray-600 font-medium block mb-1.5">Items to Transfer</label>
              <div className="flex gap-2 mb-2">
                <input className="flex-1 border border-[#e5e5e5] rounded-lg px-3 py-1.5 text-[12.5px] bg-[#f8f8f8] outline-none placeholder:text-gray-300" placeholder="Item name" />
                <input className="w-20 border border-[#e5e5e5] rounded-lg px-2 py-1.5 text-[12.5px] bg-[#f8f8f8] outline-none text-center placeholder:text-gray-300" placeholder="Qty" />
                <button className="w-8 h-8 bg-[#fff0f0] rounded-lg flex items-center justify-center flex-shrink-0"><Trash2 size={13} className="text-[#e53935]" /></button>
              </div>
            </div>
            <button className="w-full text-[12.5px] border border-[#e0e0e0] rounded-lg py-2 text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1.5 mb-4">
              <Plus size={13} /> Add Item
            </button>
            <button className="w-full bg-[#29ad82] text-white rounded-lg py-2.5 text-[13px] font-semibold hover:bg-[#1d9470] transition-colors">
              Submit Transfer
            </button>
          </div>

          {/* History */}
          <div className="bg-white border border-[#efefef] rounded-xl p-5">
            <h2 className="text-[14px] font-semibold text-[#1a1a1a] mb-4">Transfer History</h2>
            {transferHistory.map((t) => (
              <div key={t.id} className="flex items-center gap-2.5 py-2.5 border-b border-[#f5f5f5] last:border-b-0 text-[12.5px]">
                <span className="text-[#29ad82] font-semibold w-20 flex-shrink-0">{t.id}</span>
                <span className="flex-1 text-gray-700">{t.from} → {t.to}</span>
                <span className="text-gray-500">{t.items}</span>
                <span className="text-gray-400 text-[11.5px] w-14 text-right">{t.date}</span>
                <div className="w-16 text-right">
                  <StatusBadge label={t.st === "done" ? "Done" : t.st === "transit" ? "Transit" : "Pending"} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
