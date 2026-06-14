"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical, Pencil, Copy, RotateCcw, Trash2 } from "lucide-react";
import type { FullInvoice } from "@/context/SalesContext";
import { DeleteConfirmModal } from "./DeleteConfirmModal";

interface ActionMenuProps {
  invoice: FullInvoice;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ActionMenu({ invoice, onEdit, onDelete }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function out(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", out);
    return () => document.removeEventListener("mousedown", out);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
      >
        <MoreVertical size={15} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-[210px] bg-white rounded-xl shadow-2xl border border-[#efefef] z-50 py-1 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { setOpen(false); onEdit(invoice.id); }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-[#1a1a1a] hover:bg-gray-50 transition-colors"
          >
            <Pencil size={14} className="text-gray-500" />
            Edit Sales Invoice
          </button>
          <button
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-[#1a1a1a] hover:bg-gray-50 transition-colors"
          >
            <Copy size={14} className="text-gray-500" />
            Duplicate Transaction
          </button>
          <button
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-[#1a1a1a] hover:bg-gray-50 transition-colors"
          >
            <RotateCcw size={14} className="text-gray-500" />
            Convert to Sales Return
          </button>
          <div className="h-px bg-[#f0f0f0] mx-3 my-1" />
          <button
            onClick={() => { setOpen(false); setShowDeleteModal(true); }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
            Delete Sales Invoice
          </button>
        </div>
      )}

      {showDeleteModal && (
        <DeleteConfirmModal
          invoiceNo={invoice.no}
          onConfirm={() => { onDelete(invoice.id); setShowDeleteModal(false); }}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
