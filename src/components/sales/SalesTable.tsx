"use client";

import { FileText } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { FullInvoice } from "@/context/SalesContext";
import { ActionMenu } from "./ActionMenu";

interface SalesTableProps {
  invoices: FullInvoice[];
  onRowClick: (inv: FullInvoice) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SalesTable({ invoices, onRowClick, onEdit, onDelete }: SalesTableProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-white border-b border-[#f0f0f0] z-10">
          <tr>
            {["Invoice No", "Party Name", "Date", "Status", "Total Amount", "Unpaid Amount", "Action"].map((h) => (
              <th key={h} className="text-left px-5 py-3 text-[12px] text-gray-400 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoices.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center py-16 text-[13px] text-gray-400">
                No invoices found
              </td>
            </tr>
          )}
          {invoices.map((inv) => (
            <tr
              key={inv.id}
              onClick={() => onRowClick(inv)}
              className="border-b border-[#f8f8f8] hover:bg-[#fafafa] cursor-pointer group"
            >
              <td className="px-5 py-3.5">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-semibold text-[#1a1a1a]">{inv.no}</span>
                  {inv.attachImages && inv.attachImages.length > 0 ? (
                    <div className="flex gap-1">
                      {inv.attachImages.slice(0, 2).map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt=""
                          className="w-8 h-8 rounded-md object-cover border border-[#e5e5e5] flex-shrink-0"
                        />
                      ))}
                      {inv.attachImages.length > 2 && (
                        <div className="w-8 h-8 rounded-md bg-gray-100 border border-[#e5e5e5] flex items-center justify-center text-[10px] text-gray-400 font-medium flex-shrink-0">
                          +{inv.attachImages.length - 2}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-[#f5f5f5] rounded-md border border-[#ebebeb] flex items-center justify-center flex-shrink-0">
                      <div className="flex flex-col items-center gap-[3px]">
                        <div className="w-3.5 h-[1.5px] bg-[#ccc] rounded" />
                        <div className="w-3.5 h-[1.5px] bg-[#ccc] rounded" />
                        <div className="w-2.5 h-[1.5px] bg-[#ccc] rounded" />
                      </div>
                    </div>
                  )}
                </div>
              </td>
              <td className="px-5 py-3.5 text-[13px] text-gray-700">{inv.party}</td>
              <td className="px-5 py-3.5 text-[13px] text-gray-500">{inv.date}</td>
              <td className="px-5 py-3.5"><StatusBadge label={inv.status} /></td>
              <td className="px-5 py-3.5 text-[13px] font-medium text-[#1a1a1a]">{inv.amount}</td>
              <td className="px-5 py-3.5 text-[13px] font-medium text-[#1a1a1a]">{inv.balance}</td>
              <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1">
                  <button
                    className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
                    title="Download PDF"
                  >
                    <FileText size={15} />
                  </button>
                  <ActionMenu invoice={inv} onEdit={onEdit} onDelete={onDelete} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
