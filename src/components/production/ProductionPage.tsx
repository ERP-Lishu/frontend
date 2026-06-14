"use client";

import { Plus } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";

const productionOrders: { id: string; style: string; qty: number; stage: string; progress: number; due: string; stageColor: string }[] = [];

export function ProductionPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-5 py-3.5 bg-white border-b border-[#efefef] flex-shrink-0">
        <span className="text-[15px] font-semibold text-[#1a1a1a]">Production Orders</span>
        <div className="ml-auto flex gap-2">
          <button className="text-[12.5px] border border-[#e0e0e0] rounded-lg px-3 py-1.5 hover:bg-gray-50">Filter</button>
          <button className="flex items-center gap-1.5 text-[12.5px] bg-[#29ad82] text-white rounded-lg px-3 py-1.5 hover:bg-[#1d9470] transition-colors">
            <Plus size={13} /> New Order
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 bg-[#f9fafb]">
        <div className="bg-white border border-[#efefef] rounded-xl overflow-hidden">
          <table className="w-full border-collapse text-[12.5px]">
            <thead className="bg-[#fafafa] border-b border-[#f0f0f0]">
              <tr>
                {["Order #", "Style / Product", "Qty", "Stage", "Progress", "Due Date", "Actions"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[11.5px] text-gray-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {productionOrders.map((o) => (
                <tr key={o.id} className="border-b border-[#f8f8f8] hover:bg-gray-50 cursor-pointer">
                  <td className="px-5 py-4 text-[#29ad82] font-semibold">{o.id}</td>
                  <td className="px-5 py-4 font-medium text-[#1a1a1a]">{o.style}</td>
                  <td className="px-5 py-4 text-gray-700">{o.qty} pcs</td>
                  <td className="px-5 py-4">
                    <StatusBadge label={o.stage} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#29ad82] rounded-full" style={{ width: `${o.progress}%` }} />
                      </div>
                      <span className="text-[11.5px] text-gray-400">{o.progress}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-500">{o.due}</td>
                  <td className="px-5 py-4">
                    <button className="text-[12px] border border-[#e0e0e0] rounded-lg px-2.5 py-1 hover:bg-gray-50 text-gray-600">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
