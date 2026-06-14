"use client";

import { useState, useRef, useEffect } from "react";
import {
  X, ChevronDown, Trash2, Pencil, FileText, Download, Copy, RotateCcw,
} from "lucide-react";
import type { FullInvoice } from "@/context/SalesContext";
import { DeleteConfirmModal } from "./DeleteConfirmModal";

interface InvoiceModalProps {
  invoice: FullInvoice;
  onClose: () => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

export function InvoiceModal({ invoice, onClose, onDelete, onEdit }: InvoiceModalProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function out(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    }
    document.addEventListener("mousedown", out);
    return () => document.removeEventListener("mousedown", out);
  }, []);

  const subTotal = invoice.rows.reduce((s, r) => {
    const qty = parseFloat(r.qty) || 0;
    const rate = parseFloat(r.rate) || 0;
    const discPct = parseFloat(r.discPct) || 0;
    const gross = qty * rate;
    const disc = discPct > 0 ? (gross * discPct) / 100 : parseFloat(r.discAmt) || 0;
    return s + Math.max(0, gross - disc);
  }, 0);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/45 z-50 flex items-center justify-center ${showDeleteModal ? "invisible" : ""}`}
        onClick={onClose}
      >
        <div
          className="bg-white rounded-[13px] shadow-2xl w-[700px] max-h-[88vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f0] flex-shrink-0">
            <div className="text-[16px] font-bold text-[#1a1a1a]">Sales Invoice {invoice.no}</div>
            <button
              onClick={onClose}
              className="w-7 h-7 border border-[#e5e5e5] rounded-md flex items-center justify-center hover:bg-gray-50"
            >
              <X size={14} className="text-gray-500" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex justify-between mb-5 gap-5">
              <div className="flex flex-col gap-1.5 text-[13px]">
                {[
                  ["Party:", invoice.party],
                  ["Phone No.", "—"],
                  ["Balance:", invoice.balance],
                ].map(([label, val]) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-gray-400 w-[76px] flex-shrink-0">{label}</span>
                    <span className={`font-semibold ${label === "Balance:" ? "text-[#29ad82]" : "text-[#1a1a1a]"}`}>{val}</span>
                    {label === "Balance:" && <span className="text-[12px] text-gray-400">(To Receive)</span>}
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-1.5 text-right text-[13px]">
                {[
                  ["Invoice No", invoice.no],
                  ["Invoice Date:", invoice.date],
                  ["Payment Mode:", invoice.mode],
                ].map(([l, v]) => (
                  <div key={l} className="flex items-center justify-end gap-3">
                    <span className="text-gray-400">{l}</span>
                    <span className="font-semibold text-[#1a1a1a] min-w-[80px] text-right">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-[#efefef] rounded-lg overflow-hidden mb-4">
              <table className="w-full border-collapse text-[13px]">
                <thead className="bg-[#fafafa]">
                  <tr>
                    {["S.N.", "Name", "Quantity", "Rate", "Amount"].map((h, i) => (
                      <th
                        key={h}
                        className={`text-left px-4 py-2.5 text-[12px] text-gray-400 font-medium border-b border-[#efefef] ${i === 4 ? "text-right" : ""}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoice.rows.filter((r) => r.name).map((row, idx) => {
                    const qty = parseFloat(row.qty) || 0;
                    const rate = parseFloat(row.rate) || 0;
                    const discPct = parseFloat(row.discPct) || 0;
                    const gross = qty * rate;
                    const disc = discPct > 0 ? (gross * discPct) / 100 : parseFloat(row.discAmt) || 0;
                    const amt = Math.max(0, gross - disc);
                    return (
                      <tr key={row.id} className="border-b border-[#f8f8f8]">
                        <td className="px-4 py-3.5 text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-3.5 font-medium text-[#1a1a1a]">{row.name}</td>
                        <td className="px-4 py-3.5 text-gray-600">{row.qty} PCS</td>
                        <td className="px-4 py-3.5 text-gray-600">Rs. {rate.toLocaleString("en-US")}</td>
                        <td className="px-4 py-3.5 font-semibold text-[#1a1a1a] text-right">
                          Rs. {amt > 0 ? amt.toLocaleString("en-US") : "0"}
                        </td>
                      </tr>
                    );
                  })}
                  {invoice.rows.every((r) => !r.name) && (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-center text-[12.5px] text-gray-400">No items</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <div className="w-72 text-[13px]">
                {[
                  ["Sub Total:", `Rs. ${subTotal > 0 ? subTotal.toLocaleString("en-US") : "0"}`],
                  ["Total Amount:", invoice.amount],
                  ["Received Amount:", invoice.received],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between py-1.5 border-b border-[#f5f5f5]">
                    <span className="text-gray-500">{l}</span>
                    <span className="font-medium text-[#1a1a1a]">{v}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2.5 text-[14px] font-bold">
                  <span className="text-[#1a1a1a]">Amount Due:</span>
                  <span>{invoice.balance}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-6 mt-4">
              <div className="flex-1">
                {invoice.notes && (
                  <div className="mb-4">
                    <p className="text-[13px] font-semibold text-[#1a1a1a] mb-1">Remarks</p>
                    <p className="text-[13px] text-gray-500">{invoice.notes}</p>
                  </div>
                )}
                {invoice.attachImages && invoice.attachImages.length > 0 && (
                  <div>
                    <p className="text-[13px] font-semibold text-[#1a1a1a] mb-2">Images</p>
                    <div className="flex flex-wrap gap-2">
                      {invoice.attachImages.map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt=""
                          className="w-14 h-14 rounded-lg object-cover border border-[#e5e5e5]"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[#f5f5f5] text-[12px] text-gray-400">
              Created by: <span className="text-gray-600">{invoice.creator}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2 px-6 py-3.5 border-t border-[#f0f0f0] bg-white flex-shrink-0">
            <div className="relative" ref={moreRef}>
              <button
                onClick={() => setMoreOpen((o) => !o)}
                className="flex items-center gap-1.5 text-[12.5px] border border-[#e5e5e5] rounded-lg px-3.5 py-1.5 hover:bg-gray-50 text-gray-700"
              >
                More Actions{" "}
                <ChevronDown size={12} className={`transition-transform ${moreOpen ? "rotate-180" : ""}`} />
              </button>
              {moreOpen && (
                <div className="absolute left-0 bottom-full mb-1.5 w-[210px] bg-white rounded-xl shadow-2xl border border-[#efefef] z-50 py-1 overflow-hidden">
                  <button
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-[#1a1a1a] hover:bg-gray-50 transition-colors"
                  >
                    <Copy size={14} className="text-gray-500" /> Duplicate Transaction
                  </button>
                  <button
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-[#1a1a1a] hover:bg-gray-50 transition-colors"
                  >
                    <RotateCcw size={14} className="text-gray-500" /> Convert to Sales Return
                  </button>
                </div>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-8 h-8 border border-[#e5e5e5] rounded-lg flex items-center justify-center hover:bg-red-50 hover:border-red-200 text-red-400 transition-colors"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
              <button
                onClick={() => onEdit(invoice.id)}
                className="w-8 h-8 border-2 border-[#29ad82] rounded-lg flex items-center justify-center hover:bg-[#edfaf4] text-[#29ad82] transition-colors"
                title="Edit"
              >
                <Pencil size={14} />
              </button>
              <button className="flex items-center gap-1.5 text-[12.5px] border border-[#e5e5e5] rounded-lg px-3.5 py-1.5 hover:bg-gray-50 text-gray-700">
                <FileText size={13} /> Print PDF
              </button>
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 text-[12.5px] bg-[#29ad82] text-white rounded-lg px-3.5 py-1.5 hover:bg-[#1d9470] transition-colors"
              >
                <Download size={13} /> Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <DeleteConfirmModal
          invoiceNo={invoice.no}
          onConfirm={() => { onDelete(invoice.id); onClose(); }}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </>
  );
}
